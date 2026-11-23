import React from 'react';
import {
  Copy,
  FolderOpen,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  Terminal,
  Wrench,
  AppWindow,
} from 'lucide-react';
import type {CommandCategory, CommandTool, RiskLevel} from '../types/winrun';
import {CATEGORY_META} from '../data/commands';

interface CommandCardProps {
  tool: CommandTool;
  isPinned: boolean;
  isSelected: boolean;
  onTogglePin: (id: string) => void;
  onCopy: (tool: CommandTool) => void;
  onInspect: (tool: CommandTool) => void;
}

const CategoryIcon: React.FC<{category: CommandCategory}> = ({category}) => {
  const cls = 'h-4 w-4';
  switch (category) {
    case 'msc':
      return <ShieldAlert className={cls} aria-hidden="true" />;
    case 'cpl':
      return <Wrench className={cls} aria-hidden="true" />;
    case 'settings':
      return <Settings className={cls} aria-hidden="true" />;
    case 'cli':
      return <Terminal className={cls} aria-hidden="true" />;
    case 'shell':
      return <FolderOpen className={cls} aria-hidden="true" />;
    case 'exe':
    default:
      return <AppWindow className={cls} aria-hidden="true" />;
  }
};

function riskTextClass(level: RiskLevel): string {
  switch (level) {
    case 4:
      return 'text-rose-700 dark:text-rose-400 font-semibold';
    case 3:
      return 'text-amber-700 dark:text-amber-400 font-medium';
    case 2:
      return 'text-sky-700 dark:text-sky-400';
    case 1:
    default:
      return 'text-emerald-700 dark:text-emerald-400';
  }
}

export const CommandCard: React.FC<CommandCardProps> = ({
  tool,
  isPinned,
  isSelected,
  onTogglePin,
  onCopy,
  onInspect,
}) => {
  const hasBuilder = Boolean(
    (tool.parameters && tool.parameters.length > 0) ||
      (tool.presets && tool.presets.length > 0)
  );

  return (
    <article
      className={`group flex flex-col justify-between rounded-xl border bg-white p-4 transition-colors duration-150 dark:bg-[#121B27] ${
        isSelected
          ? 'border-lime-600 dark:border-lime-400/70'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <CategoryIcon category={tool.category} />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-sm font-bold text-slate-900 break-all dark:text-slate-50">
                {tool.cmd}
              </div>
              <h3 className="truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                {tool.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTogglePin(tool.id)}
            aria-label={isPinned ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
            aria-pressed={isPinned}
            className={`shrink-0 rounded-lg p-1.5 transition-colors ${
              isPinned
                ? 'text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Star
              className="h-4 w-4"
              fill={isPinned ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {tool.desc}
        </p>
      </div>

      <div className="mt-4">
        {/* Zero-pill clean typographic metadata */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {CATEGORY_META[tool.category].shortLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span className={riskTextClass(tool.riskLevel)}>
            {tool.riskLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span>{tool.admin ? 'Admin' : 'Standard'}</span>
          {tool.shortcut && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold text-lime-700 dark:text-lime-400">
                :{tool.shortcut}
              </span>
            </>
          )}
          {tool.isCustom && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-lime-700 dark:text-lime-400">
                Custom
              </span>
            </>
          )}
          {hasBuilder && (
            <>
              <span aria-hidden="true">·</span>
              <span>Flags</span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onInspect(tool)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-transparent px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{hasBuilder ? 'Builder' : 'Inspect'}</span>
          </button>

          <button
            type="button"
            onClick={() => onCopy(tool)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-lime-700/25 bg-lime-50 px-3 py-1.5 font-mono text-xs font-semibold text-lime-800 transition-colors hover:bg-lime-700 hover:text-white dark:border-lime-400/30 dark:bg-lime-400/10 dark:text-lime-300 dark:hover:bg-lime-400 dark:hover:text-slate-950 whitespace-nowrap shrink-0"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </article>
  );
};
