import React, {useState} from 'react';
import {Plus, Trash2, X} from 'lucide-react';
import type {CommandTool} from '../types/winrun';

interface ShortcutManagerModalProps {
  isOpen: boolean;
  shortcuts: Record<string, string>; // shortcut keyword -> commandId
  allTools: CommandTool[];
  onClose: () => void;
  onSaveShortcuts: (shortcuts: Record<string, string>) => void;
  onNotify: (message: string) => void;
}

export const ShortcutManagerModal: React.FC<ShortcutManagerModalProps> = ({
  isOpen,
  shortcuts,
  allTools,
  onClose,
  onSaveShortcuts,
  onNotify,
}) => {
  const [keyword, setKeyword] = useState('');
  const [selectedToolId, setSelectedToolId] = useState(allTools[0]?.id ?? '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const entries = Object.entries(shortcuts);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyword.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleanKey) {
      setError('Please enter a valid keyword alias (e.g. wlan, rdp).');
      return;
    }
    if (!selectedToolId) {
      setError('Please select a target command.');
      return;
    }

    const next = {...shortcuts, [cleanKey]: selectedToolId};
    onSaveShortcuts(next);
    setKeyword('');
    setError('');
    onNotify(`Mapped shortcut ":${cleanKey}" successfully`);
  };

  const handleDelete = (key: string) => {
    const next = {...shortcuts};
    delete next[key];
    onSaveShortcuts(next);
    onNotify(`Removed shortcut ":${key}"`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-manager-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#121B27]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="shortcut-manager-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Command Shortcuts Manager
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Map short keywords (e.g., &apos;wlan&apos;) to specific commands for instant search promotion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcut manager"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="mt-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-200"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="shortcut-keyword"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Keyword Alias *
              </label>
              <input
                id="shortcut-keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. wlan or dns"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
              />
            </div>

            <div>
              <label
                htmlFor="shortcut-target-tool"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Target Command *
              </label>
              <select
                id="shortcut-target-tool"
                value={selectedToolId}
                onChange={(e) => setSelectedToolId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
              >
                {allTools.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.cmd})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Shortcut Mapping</span>
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Shortcuts ({entries.length})
          </h3>

          {entries.length > 0 ? (
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {entries.map(([key, toolId]) => {
                const tool = allTools.find((t) => t.id === toolId);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-lime-700 dark:text-lime-400">
                        :{key}
                      </div>
                      <div className="truncate text-xs text-slate-700 dark:text-slate-300">
                        {tool ? `${tool.name} (${tool.cmd})` : toolId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(key)}
                      aria-label={`Delete shortcut ${key}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              No custom shortcuts defined yet. Type keywords above to map them.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
