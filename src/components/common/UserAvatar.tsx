import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  BookOpen,
  Feather,
  Flame,
  Crown,
  Shield,
  Heart,
  Compass,
  Anchor,
  Sparkles,
  Sun,
  Smile,
} from 'lucide-react';
import { ProfileImageType } from '../../types';
import { resolveAvatarUrl } from '../../services/apiConfig';

export interface AvatarDefinition {
  id: string;
  name: string;
  category: 'faith' | 'neutral' | 'character';
  icon: React.ComponentType<{ className?: string; size?: number }>;
  defaultBg: string;
}

export const AVATAR_PALETTES = [
  { id: 'amber', label: 'Warm Amber', bg: 'bg-amber-700', text: 'text-amber-100', hex: '#b45309', ring: 'ring-amber-500' },
  { id: 'indigo', label: 'Royal Indigo', bg: 'bg-indigo-800', text: 'text-indigo-100', hex: '#3730a3', ring: 'ring-indigo-500' },
  { id: 'emerald', label: 'Emerald Olive', bg: 'bg-emerald-800', text: 'text-emerald-100', hex: '#065f46', ring: 'ring-emerald-500' },
  { id: 'purple', label: 'Imperial Purple', bg: 'bg-purple-900', text: 'text-purple-100', hex: '#581c87', ring: 'ring-purple-500' },
  { id: 'rose', label: 'Crimson Rose', bg: 'bg-rose-900', text: 'text-rose-100', hex: '#881337', ring: 'ring-rose-500' },
  { id: 'slate', label: 'Midnight Slate', bg: 'bg-stone-800', text: 'text-stone-100', hex: '#292524', ring: 'ring-stone-400' },
  { id: 'sky', label: 'Galilee Blue', bg: 'bg-sky-800', text: 'text-sky-100', hex: '#075985', ring: 'ring-sky-500' },
  { id: 'gold', label: 'Desert Gold', bg: 'bg-amber-600', text: 'text-amber-50', hex: '#d97706', ring: 'ring-amber-400' },
];

export const PRESET_AVATARS: AvatarDefinition[] = [
  { id: 'bible', name: 'Open Scripture', category: 'faith', icon: BookOpen, defaultBg: 'bg-amber-700' },
  { id: 'dove', name: 'Holy Spirit Dove', category: 'faith', icon: Feather, defaultBg: 'bg-sky-800' },
  { id: 'light', name: 'Light of the World', category: 'faith', icon: Sun, defaultBg: 'bg-amber-600' },
  { id: 'flame', name: 'Pentecost Flame', category: 'faith', icon: Flame, defaultBg: 'bg-rose-900' },
  { id: 'crown', name: 'Crown of Glory', category: 'faith', icon: Crown, defaultBg: 'bg-amber-700' },
  { id: 'shield', name: 'Armor of Faith', category: 'faith', icon: Shield, defaultBg: 'bg-indigo-800' },
  { id: 'heart', name: 'Grace & Love', category: 'faith', icon: Heart, defaultBg: 'bg-rose-900' },
  { id: 'anchor', name: 'Anchor of Hope', category: 'faith', icon: Anchor, defaultBg: 'bg-emerald-800' },
  { id: 'shepherd', name: 'Good Shepherd', category: 'faith', icon: Compass, defaultBg: 'bg-emerald-800' },
  { id: 'sparkles', name: 'Alpha & Omega', category: 'faith', icon: Sparkles, defaultBg: 'bg-purple-900' },
  { id: 'person_neutral', name: 'Believer (Clean)', category: 'neutral', icon: UserIcon, defaultBg: 'bg-stone-800' },
  { id: 'person_joy', name: 'Joyful Pilgrim', category: 'neutral', icon: Smile, defaultBg: 'bg-indigo-800' },
];

interface UserAvatarProps {
  avatarUrl?: string | null;
  profileImageType?: ProfileImageType;
  avatarId?: string | null;
  avatarBgColor?: string | null;
  fullName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  roundedClassName?: string;
  borderClassName?: string;
  showInitialIfNoAvatar?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  profileImageType,
  avatarId,
  avatarBgColor,
  fullName = 'User',
  size = 'md',
  className = '',
  roundedClassName = 'rounded-2xl',
  borderClassName = 'border border-amber-500/30',
  showInitialIfNoAvatar = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset image error if avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl',
    custom: '',
  };

  const iconSizes = {
    xs: 11,
    sm: 15,
    md: 18,
    lg: 26,
    xl: 40,
    '2xl': 52,
    custom: 24,
  };

  const initial = fullName?.trim() ? fullName.trim().charAt(0).toUpperCase() : 'U';

  // Find background style if specified
  const paletteMatch = AVATAR_PALETTES.find(
    (p) => p.id === avatarBgColor || p.bg === avatarBgColor || p.hex === avatarBgColor
  );
  const bgColorClass = paletteMatch ? paletteMatch.bg : (avatarBgColor || 'bg-amber-700');
  const textColorClass = paletteMatch ? paletteMatch.text : 'text-amber-100';

  const resolvedSrc = resolveAvatarUrl(avatarUrl);
  const shouldTryImage =
    !imageError &&
    Boolean(resolvedSrc) &&
    (profileImageType === 'uploaded_photo' || (!profileImageType && Boolean(avatarUrl)));

  // 1. Uploaded Cloud Profile Photo (with graceful fallback on load error)
  if (shouldTryImage && resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={fullName}
        className={`${size !== 'custom' ? sizeClasses[size] : ''} ${roundedClassName} object-cover ${borderClassName} ${className} shadow-sm shrink-0`}
        referrerPolicy="no-referrer"
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  // 2. Preset Avatar (Bible, Dove, Cross, Crown, etc.)
  const targetAvatarId = avatarId || (profileImageType === 'avatar' ? avatarId : null);
  if (targetAvatarId) {
    const avatarDef = PRESET_AVATARS.find((a) => a.id === targetAvatarId);
    if (avatarDef) {
      const IconComponent = avatarDef.icon;
      return (
        <div
          className={`${size !== 'custom' ? sizeClasses[size] : ''} ${roundedClassName} ${bgColorClass} ${textColorClass} flex items-center justify-center ${borderClassName} ${className} shadow-inner font-sans font-bold select-none shrink-0`}
        >
          <IconComponent size={iconSizes[size]} className="drop-shadow-xs" />
        </div>
      );
    }
  }

  // 3. Default Initials / User Name Fallback
  if (showInitialIfNoAvatar && initial) {
    return (
      <div
        className={`${size !== 'custom' ? sizeClasses[size] : ''} ${roundedClassName} ${bgColorClass} ${textColorClass} font-serif font-bold flex items-center justify-center ${borderClassName} ${className} shadow-inner select-none shrink-0`}
      >
        {initial}
      </div>
    );
  }

  // 4. Default Holy Bible+ Icon Fallback
  return (
    <div
      className={`${size !== 'custom' ? sizeClasses[size] : ''} ${roundedClassName} ${bgColorClass} ${textColorClass} flex items-center justify-center ${borderClassName} ${className} shadow-inner select-none shrink-0`}
    >
      <UserIcon size={iconSizes[size]} />
    </div>
  );
};
