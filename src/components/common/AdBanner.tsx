import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { Sparkles, X, Info } from 'lucide-react';
import { isNativeMobileApp } from '../../services/apiConfig';
import { AllowedAdPlacement, getBannerAdUnitId, ADMOB_CONFIG } from '../../constants/admobConfig';

export interface AdBannerProps {
  placement: AllowedAdPlacement;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const { readerSettings } = useBible();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const isNative = isNativeMobileApp();
  const adUnitId = getBannerAdUnitId(placement);

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  if (isDismissed) return null;

  const bgClasses = isDark
    ? 'bg-stone-900/90 border-stone-800 text-stone-200'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-amber-50/80 border-amber-200/70 text-stone-800';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#6b5235]' : 'text-stone-500';

  return (
    <div
      id={`admob-banner-${placement}`}
      data-ad-unit-id={adUnitId}
      className={`rounded-2xl border p-3 my-3 relative overflow-hidden transition shadow-xs ${bgClasses} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 uppercase">
                {isNative ? 'AdMob Partner' : 'Sponsor / Daily Inspiration'}
              </span>
              <span className={`text-[11px] font-semibold truncate ${subText}`}>
                {placement === 'home'
                  ? 'Spiritual Growth & Study Resources'
                  : placement === 'search'
                  ? 'Christian Literature & Study Tools'
                  : 'Daily Devotion & Prayer Journals'}
              </span>
            </div>
            <div className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
              "Thy word is a lamp unto my feet, and a light unto my path." — Psalm 119:105
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setShowInfo(!showInfo)}
            id={`admob-info-btn-${placement}`}
            className="p-1 rounded-lg hover:bg-stone-500/10 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
            title="About Advertisements"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            id={`admob-dismiss-btn-${placement}`}
            className="p-1 rounded-lg hover:bg-stone-500/10 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
            title="Dismiss Ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="mt-2.5 pt-2 border-t border-stone-200/50 dark:border-stone-800/60 text-[11px] space-y-1 text-stone-500 dark:text-stone-400">
          <p>
            Holy Bible+ displays respectful, faith-aligned banners to support ongoing development, cloud synchronization, and free worldwide scripture distribution.
          </p>
          {ADMOB_CONFIG.isTestMode && (
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
              [Test Mode Active] Placement: {placement} | Unit: {adUnitId}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
