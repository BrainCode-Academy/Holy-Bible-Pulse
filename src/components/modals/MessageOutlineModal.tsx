import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { generateMessageOutline, MessageOutlineResult } from '../../services/aiApi';
import {
  Sparkles,
  X,
  BookOpen,
  Copy,
  Check,
  BookmarkPlus,
  Share2,
  RefreshCw,
  Layers,
  Users,
  Target,
  HelpCircle,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MessageOutlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopicOrPassage?: string;
  onSavedAsNote?: (noteTitle: string) => void;
}

const PRESET_TOPICS = [
  'Faith in the Midst of Trials',
  'Romans 8:28-39: More Than Conquerors',
  'Ephesians 6: The Full Armor of God',
  'The Grace and Mercy of God',
  'Psalm 23: The Good Shepherd',
  'Overcoming Anxiety and Fear',
  'Walking in Christian Love (1 Cor 13)',
  'The Power of Persistent Prayer',
  'Living with Purpose and Calling',
];

export const MessageOutlineModal: React.FC<MessageOutlineModalProps> = ({
  isOpen,
  onClose,
  initialTopicOrPassage = '',
  onSavedAsNote,
}) => {
  const { readerSettings, selectedBibleId, saveNote } = useBible();

  const [topicInput, setTopicInput] = useState<string>(initialTopicOrPassage || '');
  const [audience, setAudience] = useState<string>('Sunday Morning Congregation');
  const [style, setStyle] = useState<string>('Expository Sermon');
  const [pointsCount, setPointsCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outline, setOutline] = useState<MessageOutlineResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedToNotes, setSavedToNotes] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });

  if (!isOpen) return null;

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const modalBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-stone-200 text-stone-900';

  const cardBg = isDark
    ? 'bg-stone-800/70 border-stone-700/70'
    : isSepia
    ? 'bg-[#ebdcb9] border-[#d8c9a3]'
    : 'bg-stone-50 border-stone-200';

  const inputBg = isDark
    ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500'
    : isSepia
    ? 'bg-[#e8dec5] border-[#d8cbb0] text-[#302110] placeholder-[#8a7256]'
    : 'bg-stone-100 border-stone-200 text-stone-900 placeholder-stone-400';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#6b5235]' : 'text-stone-600';

  const handleGenerate = async (topicToUse?: string) => {
    const cleanTopic = (topicToUse !== undefined ? topicToUse : topicInput).trim();
    if (!cleanTopic) {
      setErrorMessage('Please enter a topic, theme, or scripture passage.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCopied(false);
    setSavedToNotes(false);

    try {
      const res = await generateMessageOutline({
        topicOrPassage: cleanTopic,
        audience,
        style,
        pointsCount,
        bibleVersion: selectedBibleId.toUpperCase(),
      });
      setOutline(res);
      setExpandedSections({ 0: true, 1: true, 2: true });
    } catch (err: any) {
      console.error('Error generating outline:', err);
      setErrorMessage(err.message || 'Failed to generate outline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outline) return;

    let text = `# ${outline.title}\n`;
    text += `Theme: ${outline.theme}\n`;
    text += `Key Scripture: ${outline.keyScripture}\n`;
    if (outline.supportingPassages?.length) {
      text += `Supporting Passages: ${outline.supportingPassages.join(', ')}\n`;
    }
    text += `Objective: ${outline.objective}\n\n`;

    text += `## Introduction\n`;
    text += `- Hook: ${outline.introduction.hook}\n`;
    text += `- Biblical Context: ${outline.introduction.biblicalContext}\n`;
    text += `- Central Truth: ${outline.introduction.centralTruth}\n\n`;

    text += `## Main Points\n`;
    outline.sections.forEach(s => {
      text += `### Point ${s.romanNumeral}: ${s.heading} (${s.scriptureReference})\n`;
      text += `Exposition: ${s.exposition}\n`;
      text += `Illustration: ${s.illustration}\n`;
      text += `Practical Application: ${s.practicalApplication}\n\n`;
    });

    text += `## Conclusion\n`;
    text += `- Summary: ${outline.conclusion.summary}\n`;
    text += `- Spiritual Challenge: ${outline.conclusion.challenge}\n`;
    if (outline.conclusion.reflectionQuestions?.length) {
      text += `- Reflection Questions:\n`;
      outline.conclusion.reflectionQuestions.forEach(q => (text += `  * ${q}\n`));
    }
    text += `\n## Altar Call / Response\n${outline.altarCallOrAction}\n\n`;
    text += `## Closing Prayer\n${outline.closingPrayer}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToNotes = () => {
    if (!outline) return;

    let content = `**Theme:** ${outline.theme}\n`;
    content += `**Key Scripture:** ${outline.keyScripture}\n`;
    content += `**Objective:** ${outline.objective}\n\n`;

    content += `### 1. Introduction\n`;
    content += `* **Hook:** ${outline.introduction.hook}\n`;
    content += `* **Context:** ${outline.introduction.biblicalContext}\n`;
    content += `* **Central Truth:** ${outline.introduction.centralTruth}\n\n`;

    content += `### 2. Message Points\n`;
    outline.sections.forEach(s => {
      content += `* **${s.romanNumeral}. ${s.heading}** (${s.scriptureReference})\n`;
      content += `  * *Exposition:* ${s.exposition}\n`;
      content += `  * *Illustration:* ${s.illustration}\n`;
      content += `  * *Application:* ${s.practicalApplication}\n\n`;
    });

    content += `### 3. Conclusion & Reflection\n`;
    content += `${outline.conclusion.summary}\n\n`;
    content += `**Challenge:** ${outline.conclusion.challenge}\n\n`;
    content += `**Closing Prayer:** ${outline.closingPrayer}`;

    saveNote({
      title: `Outline: ${outline.title}`,
      content,
      reference: outline.keyScripture,
      tags: ['Sermon Outline', 'Message', 'AI Study'],
    });

    setSavedToNotes(true);
    if (onSavedAsNote) {
      onSavedAsNote(outline.title);
    }
    setTimeout(() => setSavedToNotes(false), 3000);
  };

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${modalBg}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl leading-tight">
                Bible Message Outline Generator
              </h2>
              <p className={`text-xs ${subText}`}>
                AI-assisted sermon and Bible study outlines grounded in Scripture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-message-outline-modal-btn"
            className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Input Controls / Form */}
          <div className={`p-4 rounded-3xl border ${cardBg} space-y-4`}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">
                Topic, Theme, or Scripture Passage
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Romans 8:28-39, Walking in Faith, Armor of God, Forgiveness..."
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  id="message-outline-topic-input"
                  className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border outline-none transition font-medium ${inputBg}`}
                />
              </div>
            </div>

            {/* Inspiration preset chips */}
            <div>
              <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Popular Biblical Topics:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => {
                      setTopicInput(topic);
                      handleGenerate(topic);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition ${
                      topicInput === topic
                        ? 'bg-amber-500 text-white border-amber-500 font-bold'
                        : isDark
                        ? 'bg-stone-800 border-stone-700 hover:border-amber-500 text-stone-300'
                        : isSepia
                        ? 'bg-[#e4d4b2] border-[#cebfa0] text-[#302110] hover:border-amber-600'
                        : 'bg-white border-stone-200 hover:border-amber-500 text-stone-700'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Row: Audience & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Target Setting / Style
                </label>
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  id="message-outline-style-select"
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-medium ${inputBg}`}
                >
                  <option value="Expository Sermon">Expository Sermon</option>
                  <option value="Thematic Message">Thematic Message</option>
                  <option value="Bible Study Group">Bible Study Group</option>
                  <option value="Youth Message">Youth Message</option>
                  <option value="Prayer Meeting">Prayer Meeting</option>
                  <option value="Devotional Reflection">Devotional Reflection</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  id="message-outline-audience-select"
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-medium ${inputBg}`}
                >
                  <option value="Sunday Morning Congregation">General Congregation</option>
                  <option value="Youth & Young Adults">Youth &amp; Young Adults</option>
                  <option value="New Believers / Seekers">New Believers / Seekers</option>
                  <option value="Men's Fellowship">Men's Fellowship</option>
                  <option value="Women's Ministry">Women's Ministry</option>
                  <option value="Church Leaders">Church Leaders</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                  Outline Points
                </label>
                <select
                  value={pointsCount}
                  onChange={e => setPointsCount(parseInt(e.target.value, 10))}
                  id="message-outline-points-select"
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-medium ${inputBg}`}
                >
                  <option value={3}>3 Main Points (Classic)</option>
                  <option value={4}>4 Main Points (In-depth)</option>
                  <option value={5}>5 Main Points (Comprehensive)</option>
                </select>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Generate Action Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !topicInput.trim()}
                id="generate-message-outline-btn"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/20 flex items-center justify-center space-x-2 transition active:scale-98"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Scripture &amp; Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Message Outline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Rendered Generated Outline */}
          {outline && (
            <div className="space-y-4 animate-slideUp">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Ready to Preach &amp; Teach</span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    id="copy-message-outline-btn"
                    className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs flex items-center space-x-1.5 transition"
                    title="Copy outline to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSaveToNotes}
                    id="save-message-outline-to-notes-btn"
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                    title="Save outline to user notes"
                  >
                    {savedToNotes ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{savedToNotes ? 'Saved in Notes!' : 'Save as Note'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Scripture Banner */}
              <div className={`p-5 rounded-3xl border ${cardBg} space-y-3`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {outline.targetAudience}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 leading-tight">
                    {outline.title}
                  </h3>
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1">
                    Theme: {outline.theme}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
                    <span className="font-bold text-amber-800 dark:text-amber-300">Key Scripture: </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">{outline.keyScripture}</span>
                  </div>
                  {outline.supportingPassages?.length > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
                      <span className="font-bold text-amber-800 dark:text-amber-300">Supporting Texts: </span>
                      <span className="text-stone-700 dark:text-stone-300">{outline.supportingPassages.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-xs space-y-1">
                  <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span>Message Objective:</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300">{outline.objective}</p>
                </div>
              </div>

              {/* Introduction Card */}
              <div className={`p-5 rounded-3xl border ${cardBg} space-y-2.5`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Introduction &amp; Setting</span>
                </h4>
                <div className="space-y-2 text-xs leading-relaxed">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200">The Hook: </span>
                    <span className={subText}>{outline.introduction.hook}</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200">Biblical Context: </span>
                    <span className={subText}>{outline.introduction.biblicalContext}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 font-medium">
                    <span className="font-bold">Central Big Idea: </span>
                    {outline.introduction.centralTruth}
                  </div>
                </div>
              </div>

              {/* Structured Message Points */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 px-1">
                  Main Body Points
                </div>

                {outline.sections.map((section, idx) => (
                  <div key={idx} className={`p-5 rounded-3xl border ${cardBg} space-y-3`}>
                    <button
                      onClick={() => toggleSection(idx)}
                      className="w-full text-left flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {section.romanNumeral}
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-tight">
                            {section.heading}
                          </h4>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {section.scriptureReference}
                          </span>
                        </div>
                      </div>
                      <div className="p-1 text-stone-400 hover:text-stone-600">
                        {expandedSections[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {expandedSections[idx] && (
                      <div className="space-y-2.5 pt-2 border-t border-stone-200/50 dark:border-stone-700/50 text-xs">
                        <div>
                          <span className="font-bold text-stone-800 dark:text-stone-200">Exposition: </span>
                          <p className={`mt-0.5 leading-relaxed ${subText}`}>{section.exposition}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/50">
                          <span className="font-bold text-stone-800 dark:text-stone-200">Illustration / Analogy: </span>
                          <p className="mt-0.5 italic text-stone-600 dark:text-stone-300">{section.illustration}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200">
                          <span className="font-bold">Practical Life Application: </span>
                          <p className="mt-0.5">{section.practicalApplication}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Conclusion Card */}
              <div className={`p-5 rounded-3xl border ${cardBg} space-y-3`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Conclusion &amp; Spiritual Challenge
                </h4>
                <p className={`text-xs leading-relaxed ${subText}`}>{outline.conclusion.summary}</p>
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-100 text-xs font-medium">
                  <span className="font-bold">The Challenge: </span>
                  {outline.conclusion.challenge}
                </div>

                {outline.conclusion.reflectionQuestions?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reflection &amp; Discussion Questions:</span>
                    </span>
                    <ul className="list-disc list-inside text-xs space-y-1 text-stone-600 dark:text-stone-300">
                      {outline.conclusion.reflectionQuestions.map((q, qIdx) => (
                        <li key={qIdx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Altar Call & Closing Prayer */}
              <div className={`p-5 rounded-3xl border ${cardBg} space-y-3.5`}>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center space-x-1.5">
                    <Heart className="w-4 h-4" />
                    <span>Pastoral Call / Altar Response</span>
                  </h4>
                  <p className={`text-xs mt-1.5 leading-relaxed ${subText}`}>{outline.altarCallOrAction}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300">Guided Closing Prayer:</div>
                  <p className="text-xs italic text-stone-700 dark:text-stone-200 leading-relaxed font-serif">
                    "{outline.closingPrayer}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200/60 dark:border-stone-800/80 text-[11px] text-center text-stone-500 dark:text-stone-400 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          Powered by Holy Bible+ Scripture Homiletics Engine &amp; Gemini AI
        </div>
      </div>
    </div>
  );
};
