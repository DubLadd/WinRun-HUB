import React from 'react';
import {ArrowUpRight, Copy, SlidersHorizontal} from 'lucide-react';
import type {CommandTool} from '../types/winrun';
import {CATEGORY_META} from '../data/commands';

interface SpotlightPanelProps {
  selectedTool: CommandTool | null;
  onCopy: (tool: CommandTool) => void;
  onInspect: (tool: CommandTool) => void;
  onBrowseLibrary: () => void;
  onOpenPlaybooks: () => void;
}

export const SpotlightPanel: React.FC<SpotlightPanelProps> = ({
  selectedTool,
  onCopy,
  onInspect,
  onBrowseLibrary,
  onOpenPlaybooks,
}) => {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-stretch">
      <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121B27]">
        <div>
          <p className="text-xs font-semibold tracking-wide text-lime-700 dark:text-lime-400">
            Windows Administration Workspace
          </p>
          <h1 className="mt-2 max-w-xl font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50 text-balance">
            Your Windows command toolkit, ready to inspect and export.
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Search Run utilities, MMC consoles, Control Panel applets, and{' '}
            <code className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
              ms-settings:
            </code>{' '}
            deep links. Configure flags, copy commands for{' '}
            <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Win + R
            </kbd>
            , or export standalone scripts. Nothing runs automatically in your browser.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBrowseLibrary}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300 whitespace-nowrap shrink-0"
          >
            <span>Browse Command Library</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenPlaybooks}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <span>Troubleshooting Playbooks</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-[#0F1722]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Command Spotlight
            </span>
            {selectedTool ? (
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                {CATEGORY_META[selectedTool.category].shortLabel} ·{' '}
                {selectedTool.riskLabel}
              </span>
            ) : (
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Clipboard ready
              </span>
            )}
          </div>

          <div className="mt-4">
            <div className="font-mono text-xl font-bold tracking-tight text-slate-900 break-all sm:text-2xl dark:text-lime-400">
              {selectedTool ? selectedTool.cmd : 'Win + R'}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              {selectedTool
                ? selectedTool.name
                : 'Select or copy any command below to preview it here'}
            </div>
            {selectedTool && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {selectedTool.desc}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {selectedTool
              ? selectedTool.admin
                ? 'Admin may be required'
                : 'Standard access'
              : 'Press / to search'}
          </span>

          {selectedTool && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onInspect(selectedTool)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Inspect</span>
              </button>
              <button
                type="button"
                onClick={() => onCopy(selectedTool)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300 whitespace-nowrap shrink-0"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
