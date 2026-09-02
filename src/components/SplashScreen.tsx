import React from 'react';
import { Cross, Sparkles, HeartHandshake, ArrowRight } from 'lucide-react';
import { APP_LOGO, APP_LOGO_ALT } from '../constants/assets';

export const SplashScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-stone-900 via-stone-900 to-amber-950 text-white flex flex-col items-center justify-between p-6 overflow-y-auto">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="w-full max-w-sm flex justify-center pt-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Welcome to Holy Bible+</span>
        </div>
      </div>

      {/* Center Motif & Verse */}
      <div className="w-full max-w-sm my-auto text-center space-y-6">
        <div className="relative mx-auto w-28 h-28 rounded-3xl bg-amber-500/20 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center border border-amber-500/30">
          <img
            src={APP_LOGO}
            alt={APP_LOGO_ALT}
            className="w-full h-full object-cover rounded-[22px] shadow-md"
            referrerPolicy="no-referrer"
          />
        </div>

        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-amber-100">
            Holy Bible<span className="text-amber-500 font-sans text-xl ml-1 font-extrabold">+</span>
          </h1>
          <p className="text-stone-400 text-sm mt-2 leading-relaxed">
            Your peaceful, modern companion for scripture reading, prayer, and daily spiritual growth.
          </p>
        </div>

        {/* Featured Scripture Quote Card */}
        <div className="p-5 rounded-2xl bg-stone-800/60 border border-amber-500/20 backdrop-blur-md text-left space-y-2.5">
          <p className="font-serif text-amber-200/90 italic text-sm leading-relaxed">
            "Your word is a lamp to my feet, and a light for my path."
          </p>
          <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-700/50">
            <span>Psalm 119:105</span>
            <span className="text-amber-400 font-medium">Daily Light</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="w-full max-w-sm space-y-3 pb-6">
        <button
          onClick={onStart}
          id="splash-start-button"
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-semibold shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 transition transform active:scale-98"
        >
          <span>Begin Reading</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <p className="text-center text-[11px] text-stone-500 flex items-center justify-center space-x-1">
          <HeartHandshake className="w-3 h-3 text-amber-500/80" />
          <span>Multi-translation support • Offline ready • Private & Secure</span>
        </p>
      </div>
    </div>
  );
};
