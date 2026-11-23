import React from 'react';
import {Moon, Sun} from 'lucide-react';
import type {WorkspaceTab} from '../types/winrun';
import type {ThemeMode} from '../hooks/useTheme';
import {PWAInstallButton} from './PWAInstallButton';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onOpenCreate: () => void;
  onOpenShortcuts: () => void;
  onOpenBackup: () => void;
  onOpenNotes: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onOpenCreate,
  onOpenShortcuts,
  onOpenBackup,
  onOpenNotes,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-[#0B111A]/90">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('library');
            window.scrollTo({top: 0, behavior: 'smooth'});
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
        >
          WinRun <span className="text-lime-700 dark:text-lime-400">Hub</span>
        </a>

        <nav
          aria-label="Primary workspace navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => onTabChange('library')}
            className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'library'
                ? 'text-slate-950 dark:text-white font-semibold underline decoration-lime-600 dark:decoration-lime-400 decoration-2 underline-offset-8'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Command Library
          </button>
          <button
            type="button"
            onClick={() => onTabChange('playbooks')}
            className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'playbooks'
                ? 'text-slate-950 dark:text-white font-semibold underline decoration-lime-600 dark:decoration-lime-400 decoration-2 underline-offset-8'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Playbooks
          </button>
          <button
            type="button"
            onClick={onOpenCreate}
            className="py-1 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
          >
            Add Command
          </button>
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="py-1 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
          >
            Shortcuts
          </button>
          <button
            type="button"
            onClick={onOpenBackup}
            className="py-1 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
          >
            Backup &amp; JSON
          </button>
          <button
            type="button"
            onClick={onOpenNotes}
            className="py-1 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
          >
            Admin Notes
          </button>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                <span>Dark</span>
              </>
            )}
          </button>
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
