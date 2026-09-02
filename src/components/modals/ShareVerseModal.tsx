import React, { useState, useRef } from 'react';
import { useBible } from '../../context/BibleContext';
import { APP_LOGO, APP_LOGO_ALT } from '../../constants/assets';
import { X, Copy, Cross, Sparkles, Check, Download, Share2, Type, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff } from 'lucide-react';

export const ShareVerseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  verseText: string;
  reference: string;
}> = ({ isOpen, onClose, verseText, reference }) => {
  if (!isOpen) return null;

  const { selectedBibleId, bibles } = useBible();
  const [cardTheme, setCardTheme] = useState<string>('dark');
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans' | 'display' | 'script'>('serif');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [showVersion, setShowVersion] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');

  const [copied, setCopied] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const activeBible = bibles.find(b => b.id === selectedBibleId);
  const abbr = activeBible ? activeBible.abbreviation : selectedBibleId.toUpperCase();

  const themes: Array<{
    id: string;
    name: string;
    bgClass: string;
    textClass: string;
    gradientColors: [string, string, string];
    isLight: boolean;
  }> = [
    {
      id: 'dark',
      name: 'Minimalist Dark',
      bgClass: 'bg-gradient-to-br from-stone-950 via-neutral-900 to-black',
      textClass: 'text-stone-100',
      gradientColors: ['#0c0a09', '#171717', '#000000'],
      isLight: false,
    },
    {
      id: 'parchment',
      name: 'Parchment / Classic',
      bgClass: 'bg-gradient-to-br from-[#f5ecd7] via-[#ebd9b7] to-[#dfc99e]',
      textClass: 'text-[#3d2c1d]',
      gradientColors: ['#f5ecd7', '#ebd9b7', '#dfc99e'],
      isLight: true,
    },
    {
      id: 'sunrise',
      name: 'Morning Sunrise',
      bgClass: 'bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-300',
      textClass: 'text-white',
      gradientColors: ['#d97706', '#f43f5e', '#fcd34d'],
      isLight: false,
    },
    {
      id: 'mountain',
      name: 'Peaceful Mountain',
      bgClass: 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-800',
      textClass: 'text-slate-100',
      gradientColors: ['#0f172a', '#1e1b4b', '#1e293b'],
      isLight: false,
    },
    {
      id: 'lavender',
      name: 'Soft Lavender Floral',
      bgClass: 'bg-gradient-to-tr from-purple-900 via-fuchsia-900 to-indigo-950',
      textClass: 'text-purple-100',
      gradientColors: ['#581c87', '#701a75', '#1e1b4b'],
      isLight: false,
    },
    {
      id: 'galaxy',
      name: 'Night Sky Stars',
      bgClass: 'bg-gradient-to-b from-[#030712] via-[#0b1329] to-[#030712]',
      textClass: 'text-blue-100',
      gradientColors: ['#030712', '#0b1329', '#030712'],
      isLight: false,
    },
    {
      id: 'golden',
      name: 'Golden Sunlight Warmth',
      bgClass: 'bg-gradient-to-tr from-amber-700 via-amber-500 to-yellow-400',
      textClass: 'text-amber-950',
      gradientColors: ['#b45309', '#f59e0b', '#facc15'],
      isLight: true,
    },
    {
      id: 'forest',
      name: 'Forest Meadow Green',
      bgClass: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-stone-900',
      textClass: 'text-emerald-100',
      gradientColors: ['#022c22', '#134e4a', '#1c1917'],
      isLight: false,
    },
    {
      id: 'ocean',
      name: 'Ocean Shore Calm',
      bgClass: 'bg-gradient-to-tr from-sky-950 via-cyan-900 to-blue-950',
      textClass: 'text-cyan-100',
      gradientColors: ['#082f49', '#164e63', '#172554'],
      isLight: false,
    },
    {
      id: 'abstract',
      name: 'Modern Abstract Gradient',
      bgClass: 'bg-gradient-to-tr from-indigo-900 via-purple-800 to-pink-700',
      textClass: 'text-white',
      gradientColors: ['#312e81', '#6b21a8', '#be185d'],
      isLight: false,
    },
  ];

  const currentTheme = themes.find(t => t.id === cardTheme) || themes[0];

  const getFontFamily = () => {
    switch (fontStyle) {
      case 'sans':
        return 'font-sans';
      case 'display':
        return 'font-serif tracking-wide';
      case 'script':
        return 'font-serif italic';
      case 'serif':
      default:
        return 'font-serif';
    }
  };

  const getCanvasFontFamily = () => {
    switch (fontStyle) {
      case 'sans':
        return 'system-ui, -apple-system, sans-serif';
      case 'display':
        return 'Cinzel, Georgia, serif';
      case 'script':
        return 'italic Georgia, serif';
      case 'serif':
      default:
        return 'Georgia, serif';
    }
  };

  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'small':
        return 'text-xs sm:text-sm';
      case 'large':
        return 'text-base sm:text-xl font-bold';
      case 'medium':
      default:
        return 'text-sm sm:text-base font-semibold';
    }
  };

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
      default:
        return 'text-center';
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square max-h-[380px]';
      case '16:9':
        return 'aspect-video max-h-[260px]';
      case '9:16':
      default:
        return 'aspect-[9/16] max-h-[420px]';
    }
  };

  const renderToCanvas = async (width: number, height: number): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, height, width, 0);
    grad.addColorStop(0, currentTheme.gradientColors[0]);
    grad.addColorStop(0.5, currentTheme.gradientColors[1]);
    grad.addColorStop(1, currentTheme.gradientColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative circle/halo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.4, 0, Math.PI * 2);
    ctx.fill();

    const textColor = currentTheme.isLight ? '#291e12' : '#ffffff';
    const accentColor = currentTheme.isLight ? '#854d0e' : '#f59e0b';
    const subColor = currentTheme.isLight ? '#5a4228' : 'rgba(255, 255, 255, 0.7)';

    // Load and draw official Holy Bible+ logo
    try {
      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = APP_LOGO;
      });
      const logoSize = Math.round(Math.min(width, height) * 0.09);
      const logoX = width / 2 - logoSize / 2;
      const logoY = height * 0.05;

      ctx.save();
      const r = 16;
      ctx.beginPath();
      ctx.moveTo(logoX + r, logoY);
      ctx.arcTo(logoX + logoSize, logoY, logoX + logoSize, logoY + logoSize, r);
      ctx.arcTo(logoX + logoSize, logoY + logoSize, logoX, logoY + logoSize, r);
      ctx.arcTo(logoX, logoY + logoSize, logoX, logoY, r);
      ctx.arcTo(logoX, logoY, logoX + logoSize, logoY, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch {
      // Fallback if image load fails
    }

    // Header branding
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOLY BIBLE+', width / 2, height * 0.17);

    if (showVersion) {
      ctx.fillStyle = subColor;
      ctx.font = '28px sans-serif';
      ctx.fillText(`— ${abbr} TRANSLATION —`, width / 2, height * 0.21);
    }

    // Scripture text wrapping
    const textBaseSize = fontSize === 'small' ? 38 : fontSize === 'large' ? 56 : 46;
    ctx.fillStyle = textColor;
    ctx.font = `${fontStyle === 'script' ? 'italic ' : fontStyle === 'display' ? 'bold ' : ''}${textBaseSize}px ${getCanvasFontFamily()}`;
    
    let alignX = width / 2;
    if (textAlign === 'left') {
      ctx.textAlign = 'left';
      alignX = width * 0.1;
    } else if (textAlign === 'right') {
      ctx.textAlign = 'right';
      alignX = width * 0.9;
    } else {
      ctx.textAlign = 'center';
    }

    const maxWidth = width * 0.82;
    const words = (`"${verseText}"`).split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const lineHeight = textBaseSize * 1.45;
    const startY = height * 0.52 - (lines.length * lineHeight) / 2;

    lines.forEach((l, idx) => {
      ctx.fillText(l.trim(), alignX, startY + idx * lineHeight);
    });

    // Reference
    ctx.fillStyle = accentColor;
    ctx.font = `bold ${textBaseSize * 1.05}px Georgia, serif`;
    ctx.fillText(`— ${reference}`, alignX, startY + lines.length * lineHeight + textBaseSize * 1.5);

    // Footer
    ctx.fillStyle = subColor;
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Shared via Holy Bible+ App', width / 2, height * 0.92);

    return canvas;
  };

  const handleCopyText = () => {
    const versionPart = showVersion ? ` (${abbr})` : '';
    navigator.clipboard.writeText(`"${verseText}" — ${reference}${versionPart}\nShared via Holy Bible+`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyImage = async () => {
    try {
      let width = 1080;
      let height = 1920;
      if (aspectRatio === '1:1') {
        height = 1080;
      } else if (aspectRatio === '16:9') {
        height = 608;
      }
      const canvas = await renderToCanvas(width, height);
      if (!canvas) return;

      canvas.toBlob(async blob => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        } else {
          handleCopyText();
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Image clipboard write error, falling back to text', err);
      handleCopyText();
    }
  };

  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      let width = 1080;
      let height = 1920;
      if (aspectRatio === '1:1') {
        height = 1080;
      } else if (aspectRatio === '16:9') {
        height = 608;
      }
      const canvas = await renderToCanvas(width, height);
      if (!canvas) return;

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `HolyBiblePlus-${reference.replace(/[^a-zA-Z0-9]/g, '_')}-${aspectRatio.replace(':', 'x')}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.warn('Failed image canvas export', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        const versionPart = showVersion ? ` (${abbr})` : '';
        await navigator.share({
          title: `Scripture: ${reference}`,
          text: `"${verseText}" — ${reference}${versionPart}`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Share cancelled or unavailable', err);
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl p-5 rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-bold text-lg text-amber-100">Share Scripture Image</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Card Preview */}
        <div
          ref={cardRef}
          className={`p-6 sm:p-7 rounded-2xl shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between mx-auto w-full border border-white/10 ${getAspectClass()} ${currentTheme.bgClass} ${currentTheme.textClass}`}
        >
          <div className="flex items-center justify-between opacity-90 text-xs">
            <div className="flex items-center space-x-2 font-bold tracking-tight">
              <img
                src={APP_LOGO}
                alt={APP_LOGO_ALT}
                className="w-5 h-5 rounded-md object-cover border border-amber-500/40 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <span>Holy Bible+</span>
            </div>
            {showVersion && (
              <span className="uppercase tracking-wider text-[10px] font-black px-2 py-0.5 rounded bg-black/25">
                {abbr}
              </span>
            )}
          </div>

          <div className={`my-auto space-y-2.5 ${getTextAlignClass()}`}>
            <blockquote className={`${getFontFamily()} ${getFontSizeClasses()} leading-relaxed drop-shadow-md`}>
              "{verseText}"
            </blockquote>
            <div className={`font-serif font-bold text-sm sm:text-base tracking-wide ${currentTheme.isLight ? 'text-amber-900' : 'text-amber-300'}`}>
              — {reference}
            </div>
          </div>

          <div className="text-center opacity-60 text-[9px] tracking-widest uppercase">
            Shared via Holy Bible+ App
          </div>
        </div>

        {/* 10 Theme Background Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
            <span>10 Card Themes:</span>
            <span className="text-[11px] text-amber-400 font-bold">{currentTheme.name}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setCardTheme(t.id)}
                className={`h-9 rounded-xl border transition flex items-center justify-center ${t.bgClass} ${
                  cardTheme === t.id ? 'ring-2 ring-amber-400 scale-105 shadow-md border-amber-400' : 'opacity-70 hover:opacity-100 border-stone-700'
                }`}
                title={t.name}
              >
                {cardTheme === t.id && (
                  <Check className={`w-4 h-4 ${t.isLight ? 'text-stone-900' : 'text-white'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customization Toolbar Controls */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-3 text-xs">
          {/* Typography Style & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Font Style</label>
              <div className="flex rounded-xl bg-stone-800 p-0.5 border border-stone-700">
                {(['serif', 'sans', 'display', 'script'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setFontStyle(style)}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg capitalize transition ${
                      fontStyle === style ? 'bg-amber-500 text-stone-950 font-bold shadow-xs' : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Font Size</label>
              <div className="flex rounded-xl bg-stone-800 p-0.5 border border-stone-700">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg capitalize transition ${
                      fontSize === size ? 'bg-amber-500 text-stone-950 font-bold shadow-xs' : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect Ratio & Alignment & Version Toggle */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800">
            {/* Aspect Ratio */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Ratio</label>
              <div className="flex rounded-xl bg-stone-800 p-0.5 border border-stone-700">
                {(['9:16', '1:1', '16:9'] as const).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                      aspectRatio === ratio ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-300'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Alignment */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Align</label>
              <div className="flex rounded-xl bg-stone-800 p-0.5 border border-stone-700">
                <button
                  onClick={() => setTextAlign('left')}
                  className={`flex-1 py-1 flex items-center justify-center rounded-lg ${textAlign === 'left' ? 'bg-amber-500 text-stone-950' : 'text-stone-300'}`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className={`flex-1 py-1 flex items-center justify-center rounded-lg ${textAlign === 'center' ? 'bg-amber-500 text-stone-950' : 'text-stone-300'}`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTextAlign('right')}
                  className={`flex-1 py-1 flex items-center justify-center rounded-lg ${textAlign === 'right' ? 'bg-amber-500 text-stone-950' : 'text-stone-300'}`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Version Toggle */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase">Version</label>
              <button
                onClick={() => setShowVersion(!showVersion)}
                className={`w-full py-1 px-2 rounded-xl border flex items-center justify-center space-x-1 font-bold text-[10px] transition ${
                  showVersion ? 'bg-stone-800 text-amber-400 border-amber-500/40' : 'bg-stone-900 text-stone-500 border-stone-800'
                }`}
              >
                {showVersion ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{showVersion ? 'Show' : 'Hide'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Saving...' : 'Download'}</span>
          </button>

          <button
            onClick={handleCopyImage}
            className="py-2.5 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs flex items-center justify-center space-x-1.5 border border-stone-700 transition active:scale-95"
          >
            {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
          </button>

          <button
            onClick={handleWebShare}
            className="py-2.5 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs flex items-center justify-center space-x-1.5 border border-stone-700 transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Share</span>
          </button>

          <button
            onClick={handleCopyText}
            className="py-2.5 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs flex items-center justify-center space-x-1.5 border border-stone-700 transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
