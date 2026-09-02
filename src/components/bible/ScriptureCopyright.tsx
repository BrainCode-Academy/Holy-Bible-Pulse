import React from 'react';
import { Shield, Info } from 'lucide-react';

interface ScriptureCopyrightProps {
  copyright?: string;
  abbreviation?: string;
  isPublicDomain?: boolean;
}

export const ScriptureCopyright: React.FC<ScriptureCopyrightProps> = ({
  copyright,
  abbreviation,
  isPublicDomain,
}) => {
  if (!copyright && !abbreviation) return null;

  return (
    <div className="mt-8 pt-4 border-t border-stone-200/60 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 space-y-1 select-none">
      <div className="flex items-center space-x-1.5 font-medium text-stone-600 dark:text-stone-300">
        <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Translation & Copyright Information</span>
      </div>
      {copyright && (
        <p className="leading-relaxed italic text-[11px] text-stone-500 dark:text-stone-400">
          {copyright}
        </p>
      )}
      <div className="flex items-center space-x-2 text-[10px] text-stone-400 pt-0.5">
        <span>Version: {abbreviation || 'Bible'}</span>
        <span>•</span>
        <span>{isPublicDomain ? 'Public Domain' : 'Licensed via Scripture API'}</span>
      </div>
    </div>
  );
};
