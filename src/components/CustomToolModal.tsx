import React, {useEffect, useState} from 'react';
import {X} from 'lucide-react';
import type {CommandCategory, CommandTool, RiskLevel} from '../types/winrun';
import {CATEGORY_META, RISK_META} from '../data/commands';

interface CustomToolModalProps {
  isOpen: boolean;
  editingTool: CommandTool | null;
  onClose: () => void;
  onSave: (tool: CommandTool) => void;
}

export const CustomToolModal: React.FC<CustomToolModalProps> = ({
  isOpen,
  editingTool,
  onClose,
  onSave,
}) => {
  const [cmd, setCmd] = useState('');
  const [name, setName] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [category, setCategory] = useState<CommandCategory>('exe');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(2);
  const [admin, setAdmin] = useState(false);
  const [desc, setDesc] = useState('');
  const [note, setNote] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTool) {
      setCmd(editingTool.cmd);
      setName(editingTool.name);
      setShortcut(editingTool.shortcut ?? '');
      setCategory(editingTool.category);
      setRiskLevel(editingTool.riskLevel);
      setAdmin(editingTool.admin);
      setDesc(editingTool.desc);
      setNote(editingTool.note);
      setTagsRaw(editingTool.tags.join(', '));
    } else {
      setCmd('');
      setName('');
      setShortcut('');
      setCategory('exe');
      setRiskLevel(2);
      setAdmin(false);
      setDesc('');
      setNote('');
      setTagsRaw('');
    }
    setError('');
  }, [isOpen, editingTool]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = cmd.trim();
    const cleanName = name.trim();
    if (!cleanCmd) {
      setError('Please enter a Windows command or URI.');
      return;
    }
    if (!cleanName) {
      setError('Please enter a display name.');
      return;
    }

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanShortcut = shortcut.trim()
      ? shortcut.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
      : undefined;

    const nextTool: CommandTool = {
      id:
        editingTool?.id ??
        `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cmd: cleanCmd,
      name: cleanName,
      shortcut: cleanShortcut,
      category,
      desc: desc.trim() || 'Custom user-defined Windows command.',
      note:
        note.trim() ||
        'Verify syntax and privilege level before running on a workstation.',
      tags: tags.length > 0 ? tags : ['custom'],
      admin,
      riskLevel,
      riskLabel: RISK_META[riskLevel].label,
      isCustom: true,
      createdAt: editingTool?.createdAt ?? new Date().toISOString(),
    };

    onSave(nextTool);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-tool-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#121B27]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="custom-tool-modal-title"
            className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {editingTool ? 'Edit Custom Command' : 'Add Custom Command'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-200"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="custom-cmd-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Command / URI *
            </label>
            <input
              id="custom-cmd-input"
              type="text"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="e.g. mstsc /v:10.0.0.12 or ms-settings:network-vpn"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="custom-name-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tool Name *
              </label>
              <input
                id="custom-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Remote Desktop"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
              />
            </div>

            <div>
              <label
                htmlFor="custom-shortcut-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Shortcut Keyword (Alias)
              </label>
              <input
                id="custom-shortcut-input"
                type="text"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="e.g. rdp or :rdp"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="custom-category-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Category
              </label>
              <select
                id="custom-category-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CommandCategory)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
              >
                {(Object.keys(CATEGORY_META) as CommandCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="custom-risk-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Risk Classification
              </label>
              <select
                id="custom-risk-select"
                value={riskLevel}
                onChange={(e) =>
                  setRiskLevel(Number(e.target.value) as RiskLevel)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
              >
                {([1, 2, 3, 4] as RiskLevel[]).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {RISK_META[lvl].label} — {RISK_META[lvl].badgeText}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-desc-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id="custom-desc-input"
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What does this command open or modify?"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
            />
          </div>

          <div>
            <label
              htmlFor="custom-note-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Safety / Usage Note
            </label>
            <input
              id="custom-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional caution or edition requirement"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
            />
          </div>

          <div>
            <label
              htmlFor="custom-tags-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Search Keywords (comma-separated)
            </label>
            <input
              id="custom-tags-input"
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="rdp, remote, server, vpn"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={admin}
              onChange={(e) => setAdmin(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-lime-600 dark:border-slate-600 dark:accent-lime-400"
            />
            <span>Requires Administrator elevation</span>
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300"
            >
              {editingTool ? 'Save Changes' : 'Add to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
