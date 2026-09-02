import { Verse } from '../types';
import { trackEvent } from './analyticsClient';
import { APP_LOGO } from '../constants/assets';

export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentVerseIndex: number;
  currentVerse: Verse | null;
  totalVerses: number;
  chapterReference: string;
  rate: number;
  selectedVoiceURI: string | null;
  autoPlayNextChapter: boolean;
  isAvailable: boolean;
  isLanguageSupported: boolean;
  detectedVoiceName: string | null;
  errorMessage: string | null;
}

export type AudioStateListener = (state: AudioState) => void;
export type ChapterCompleteListener = (chapterRef: string) => void;

class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private verses: Verse[] = [];
  private chapterReference: string = '';
  private currentVerseIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private rate: number = 1.0;
  private selectedVoiceURI: string | null = null;
  private autoPlayNextChapter: boolean = false;
  private listeners: Set<AudioStateListener> = new Set();
  private chapterCompleteListeners: Set<ChapterCompleteListener> = new Set();
  private availableVoices: SpeechSynthesisVoice[] = [];
  private languageCode: string = 'eng';
  private hasLanguageVoice: boolean = true;
  private activeVoiceName: string | null = null;
  private errorMessage: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  private loadVoices() {
    if (!this.synth) return;
    this.availableVoices = this.synth.getVoices();
    this.notify();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.availableVoices.length === 0) {
      this.availableVoices = this.synth.getVoices();
    }
    return this.availableVoices;
  }

  public getMatchingVoiceForLanguage(langCode: string = 'eng'): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    // If user explicitly picked a voice URI
    if (this.selectedVoiceURI) {
      const matched = voices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (matched) {
        this.hasLanguageVoice = true;
        this.activeVoiceName = matched.name;
        return matched;
      }
    }

    // Map 3-letter codes to 2-letter ISO prefix
    const langMap: Record<string, string> = {
      eng: 'en',
      yor: 'yo',
      ibo: 'ig',
      hau: 'ha',
      spa: 'es',
      fra: 'fr',
      deu: 'de',
      por: 'pt',
      zho: 'zh',
      rus: 'ru',
      ara: 'ar',
      hin: 'hi',
    };

    const prefix = langMap[langCode.toLowerCase()] || langCode.slice(0, 2).toLowerCase();

    // Try exact or prefix match
    const langVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
    if (langVoice) {
      this.hasLanguageVoice = true;
      this.activeVoiceName = langVoice.name;
      return langVoice;
    }

    // Fallback to default system voice
    this.hasLanguageVoice = false;
    const defaultVoice = voices.find(v => v.default) || voices[0];
    this.activeVoiceName = defaultVoice ? defaultVoice.name : null;
    return defaultVoice || null;
  }

  public isLanguageDirectlySupported(langCode: string = 'eng'): boolean {
    const voices = this.getVoices();
    if (voices.length === 0) return true; // Voices might not be loaded yet
    const langMap: Record<string, string> = {
      eng: 'en',
      yor: 'yo',
      ibo: 'ig',
      hau: 'ha',
      spa: 'es',
      fra: 'fr',
      deu: 'de',
      por: 'pt',
      zho: 'zh',
      rus: 'ru',
      ara: 'ar',
      hin: 'hi',
    };
    const prefix = langMap[langCode.toLowerCase()] || langCode.slice(0, 2).toLowerCase();
    return voices.some(v => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeChapterComplete(listener: ChapterCompleteListener): () => void {
    this.chapterCompleteListeners.add(listener);
    return () => {
      this.chapterCompleteListeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  public getState(): AudioState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentVerseIndex: this.currentVerseIndex,
      currentVerse: this.verses[this.currentVerseIndex] || null,
      totalVerses: this.verses.length,
      chapterReference: this.chapterReference,
      rate: this.rate,
      selectedVoiceURI: this.selectedVoiceURI,
      autoPlayNextChapter: this.autoPlayNextChapter,
      isAvailable: !!this.synth,
      isLanguageSupported: this.hasLanguageVoice,
      detectedVoiceName: this.activeVoiceName,
      errorMessage: this.errorMessage || (!this.synth ? 'Text-to-Speech is not available on this device or browser.' : null),
    };
  }

  public setRate(rate: number) {
    this.rate = rate;
    if (this.isPlaying && !this.isPaused && this.currentUtterance) {
      // Re-speak current verse at new rate
      this.speakVerse(this.currentVerseIndex);
    } else {
      this.notify();
    }
  }

  public setSelectedVoiceURI(voiceURI: string | null) {
    this.selectedVoiceURI = voiceURI;
    if (this.isPlaying && !this.isPaused) {
      this.speakVerse(this.currentVerseIndex);
    } else {
      this.notify();
    }
  }

  public setAutoPlayNextChapter(enabled: boolean) {
    this.autoPlayNextChapter = enabled;
    this.notify();
  }

  public startChapter(
    verses: Verse[],
    chapterReference: string,
    languageCode: string = 'eng',
    startIndex: number = 0
  ) {
    if (!this.synth) {
      this.errorMessage = 'Text-to-Speech is not supported on this device/browser.';
      this.notify();
      return;
    }

    this.stop();
    this.errorMessage = null;

    if (!verses || verses.length === 0) {
      this.errorMessage = 'No verses available to read.';
      this.notify();
      return;
    }

    this.verses = verses;
    this.chapterReference = chapterReference;
    this.languageCode = languageCode;
    this.currentVerseIndex = Math.max(0, Math.min(startIndex, verses.length - 1));
    this.isPlaying = true;
    this.isPaused = false;

    // Track analytics event
    trackEvent('audio_tts_played', {
      chapterRef: chapterReference,
      languageCode,
      verseCount: verses.length,
    });

    this.setupMediaSession();
    this.speakVerse(this.currentVerseIndex);
  }

  private setupMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.chapterReference,
          artist: 'Holy Bible+ Text-to-Speech',
          album: 'Holy Bible+',
          artwork: [
            { src: APP_LOGO, sizes: '512x512', type: 'image/png' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => this.resume());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previousVerse());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextVerse());
        navigator.mediaSession.setActionHandler('stop', () => this.stop());
      } catch (e) {
        // Media session unsupported actions gracefully ignored
      }
    }
  }

  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/\(\d+\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private speakVerse(index: number) {
    if (!this.synth || !this.isPlaying) return;

    this.synth.cancel();

    if (index < 0 || index >= this.verses.length) {
      this.handleChapterFinished();
      return;
    }

    this.currentVerseIndex = index;
    const verse = this.verses[index];
    const cleaned = this.cleanText(verse.text);

    // Speak format: "Verse X. [Clean Scripture Text]"
    const textToSpeak = `Verse ${verse.number}. ${cleaned}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = this.rate;

    const voice = this.getMatchingVoiceForLanguage(this.languageCode);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    // Update MediaSession title to current verse
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && navigator.mediaSession.metadata) {
      try {
        navigator.mediaSession.metadata.title = `${this.chapterReference} (Verse ${verse.number})`;
      } catch {
        // Ignore
      }
    }

    utterance.onend = () => {
      if (this.isPlaying && !this.isPaused) {
        if (this.currentVerseIndex + 1 < this.verses.length) {
          this.speakVerse(this.currentVerseIndex + 1);
        } else {
          this.handleChapterFinished();
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('TTS utterance error:', e);
      }
      if (this.isPlaying && !this.isPaused && this.currentVerseIndex + 1 < this.verses.length) {
        this.speakVerse(this.currentVerseIndex + 1);
      } else if (this.currentVerseIndex + 1 >= this.verses.length) {
        this.handleChapterFinished();
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    this.notify();
  }

  private handleChapterFinished() {
    const finishedRef = this.chapterReference;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.notify();

    this.chapterCompleteListeners.forEach(fn => fn(finishedRef));
  }

  public pause() {
    if (!this.synth || !this.isPlaying || this.isPaused) return;
    this.synth.pause();
    this.isPaused = true;
    this.notify();
  }

  public resume() {
    if (!this.synth || !this.isPlaying || !this.isPaused) return;
    this.synth.resume();
    this.isPaused = false;
    this.notify();
  }

  public play() {
    if (this.isPaused) {
      this.resume();
    } else if (this.verses.length > 0) {
      this.startChapter(this.verses, this.chapterReference, this.languageCode, this.currentVerseIndex);
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.notify();
  }

  public nextVerse() {
    if (this.verses.length === 0) return;
    const nextIdx = Math.min(this.currentVerseIndex + 1, this.verses.length - 1);
    this.isPlaying = true;
    this.isPaused = false;
    this.speakVerse(nextIdx);
  }

  public previousVerse() {
    if (this.verses.length === 0) return;
    const prevIdx = Math.max(this.currentVerseIndex - 1, 0);
    this.isPlaying = true;
    this.isPaused = false;
    this.speakVerse(prevIdx);
  }

  public jumpToVerse(index: number) {
    if (index >= 0 && index < this.verses.length) {
      this.isPlaying = true;
      this.isPaused = false;
      this.speakVerse(index);
    }
  }
}

export const audioService = new AudioService();
