import React, { useState, useEffect } from 'react';
import { audioService, AudioState } from '../../services/audioService';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, X, Gauge, AlertCircle } from 'lucide-react';

export const AudioPlayerBar: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [state, setState] = useState<AudioState>(audioService.getState());
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = audioService.subscribe(s => setState(s));
    return () => unsubscribe();
  }, []);

  if (!state.isPlaying && !state.isPaused) {
    return null;
  }

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  const handleTogglePlayPause = () => {
    if (state.isPaused) {
      audioService.resume();
    } else if (state.isPlaying) {
      audioService.pause();
    } else {
      audioService.play();
    }
  };

  const handleStop = () => {
    audioService.stop();
    onClose();
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-30 animate-slideUp">
      <div className="p-3.5 sm:p-4 rounded-3xl bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md text-stone-100 border border-stone-800 shadow-2xl space-y-2.5">
        {/* Top Meta Line: Chapter + Verse + Language Warning + Close */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-bold text-sm leading-tight text-amber-300 truncate">
                {state.chapterReference}
              </div>
              <div className="text-[11px] text-stone-400 font-sans truncate">
                {state.currentVerse
                  ? `Reading Verse ${state.currentVerse.number} of ${state.totalVerses}`
                  : 'Text-to-Speech active'}
                {!state.isLanguageSupported && (
                  <span className="ml-1.5 text-amber-400/90 text-[10px]">
                    (Device Fallback Voice)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Speed Pill Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                id="audio-speed-btn"
                className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold flex items-center space-x-1 transition"
                title="Playback Speed"
              >
                <Gauge className="w-3 h-3 text-amber-400" />
                <span>{state.rate}×</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 bottom-8 bg-stone-900 border border-stone-800 rounded-2xl p-1.5 shadow-xl flex flex-col space-y-1 z-40 min-w-[70px]">
                  {speeds.map(sp => (
                    <button
                      key={sp}
                      id={`audio-speed-option-${sp}x`}
                      onClick={() => {
                        audioService.setRate(sp);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold text-left transition ${
                        state.rate === sp
                          ? 'bg-amber-500 text-stone-950 font-black'
                          : 'hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      {sp}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleStop}
              id="audio-close-btn"
              className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
              title="Stop Audio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error message banner if any */}
        {state.errorMessage && (
          <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-[11px] flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{state.errorMessage}</span>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-center space-x-4 pt-1">
          {/* Previous Verse */}
          <button
            onClick={() => audioService.previousVerse()}
            disabled={state.currentVerseIndex <= 0}
            id="audio-prev-verse-btn"
            className="p-2 rounded-2xl bg-stone-800/80 hover:bg-stone-800 disabled:opacity-40 text-stone-200 transition active:scale-95"
            title="Previous Verse"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Main Button */}
          <button
            onClick={handleTogglePlayPause}
            id="audio-play-pause-btn"
            className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition shadow-lg active:scale-95 flex items-center justify-center"
            title={state.isPaused ? 'Resume' : 'Pause'}
          >
            {state.isPaused ? (
              <Play className="w-5 h-5 fill-stone-950" />
            ) : (
              <Pause className="w-5 h-5 fill-stone-950" />
            )}
          </button>

          {/* Next Verse */}
          <button
            onClick={() => audioService.nextVerse()}
            disabled={state.currentVerseIndex >= state.totalVerses - 1}
            id="audio-next-verse-btn"
            className="p-2 rounded-2xl bg-stone-800/80 hover:bg-stone-800 disabled:opacity-40 text-stone-200 transition active:scale-95"
            title="Next Verse"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            id="audio-stop-btn"
            className="p-2 rounded-2xl bg-stone-800/80 hover:bg-stone-800 text-rose-400 transition active:scale-95 ml-2"
            title="Stop Playback"
          >
            <Square className="w-4 h-4 fill-rose-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
