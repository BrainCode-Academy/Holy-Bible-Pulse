import React from 'react';
import { useBible, ScreenTab } from '../context/BibleContext';
import { UserAvatar } from './common/UserAvatar';
import { APP_LOGO, APP_LOGO_ALT } from '../constants/assets';
import {
  Home,
  BookOpen,
  Calendar,
  Bookmark,
  User as UserIcon,
  Search,
  Cross,
  Sparkles,
} from 'lucide-react';

export const NavigationHeader: React.FC<{
  onOpenSearch: () => void;
  onOpenPrayer: () => void;
}> = ({ onOpenSearch, onOpenPrayer }) => {
  const { activeTab, readerSettings } = useBible();

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const headerBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#433422]'
    : 'bg-white border-amber-100/60 text-stone-900';

  return (
    <header className={`sticky top-0 z-30 border-b px-4 py-3 transition-colors ${headerBg}`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center space-x-2.5">
          <img
            src={APP_LOGO}
            alt={APP_LOGO_ALT}
            className="w-9 h-9 rounded-xl object-cover shadow-sm shadow-amber-500/20 border border-amber-500/30"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-serif font-bold text-lg tracking-tight flex items-center gap-1">
              Holy Bible<span className="text-amber-600 font-sans text-xs font-black uppercase px-1.2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">PLUS</span>
            </span>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenPrayer}
            id="header-prayer-button"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              isDark
                ? 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/60 border border-amber-800/50'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">Prayer Guide</span>
            <span className="sm:hidden">Pray</span>
          </button>

          <button
            onClick={onOpenSearch}
            id="header-search-button"
            className={`p-2 rounded-full transition ${
              isDark
                ? 'hover:bg-stone-800 text-stone-300'
                : isSepia
                ? 'hover:bg-[#e8deca] text-[#433422]'
                : 'hover:bg-stone-100 text-stone-600'
            }`}
            title="Search Scripture"
            aria-label="Search Scripture"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, readerSettings, user } = useBible();

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const navBg = isDark
    ? 'bg-stone-900/95 border-stone-800 text-stone-400'
    : isSepia
    ? 'bg-[#f4ecd8]/95 border-[#e2d7be] text-[#715a3e]'
    : 'bg-white/95 border-stone-200/70 text-stone-500';

  const navItems: Array<{ id: ScreenTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'bible', label: 'Bible', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'plans', label: 'Plans', icon: <Calendar className="w-5 h-5" /> },
    { id: 'saved', label: 'Saved', icon: <Bookmark className="w-5 h-5" /> },
    {
      id: 'settings',
      label: 'Me',
      icon: user ? (
        <UserAvatar
          avatarUrl={user.avatarUrl}
          profileImageType={user.profileImageType}
          avatarId={user.avatarId}
          avatarBgColor={user.avatarBgColor}
          fullName={user.fullName}
          size="xs"
          roundedClassName="rounded-full"
          borderClassName="border border-amber-600"
        />
      ) : (
        <UserIcon className="w-5 h-5" />
      ),
    },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md transition-colors ${navBg}`}>
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-1">
        {navItems.map(item => {
          const isActive =
            activeTab === item.id ||
            (activeTab === 'reader' && item.id === 'bible') ||
            (activeTab === 'search' && item.id === 'home') ||
            (activeTab === 'admin' && item.id === 'settings');

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'text-amber-400 font-semibold'
                    : isSepia
                    ? 'text-[#302110] font-semibold'
                    : 'text-amber-700 font-semibold'
                  : 'hover:opacity-80'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

