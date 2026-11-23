import React, {useEffect, useMemo, useState} from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  FileCode2,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type {CommandTool} from '../types/winrun';
import {CATEGORY_META, RISK_META} from '../data/commands';
import {
  assembleCommand,
  downloadTextFile,
  generateBatchScript,
  generatePowerShellScript,
} from '../utils/scripts';

interface InspectorDrawerProps {
  tool: CommandTool | null;
  isPinned: boolean;
  onClose: () => void;
  onCopyText: (command: string, tool: CommandTool) => void;
  onTogglePin: (id: string) => void;
  onEditCustom?: (tool: CommandTool) => void;
  onDeleteCustom?: (id: string) => void;
  onNotify: (message: string) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  tool,
  isPinned,
  onClose,
  onCopyText,
  onTogglePin,
  onEditCustom,
  onDeleteCustom,
  onNotify,
}) => {
  const [activeFlags, setActiveFlags] = useState<Record<string, boolean>>({});
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [presetOverride, setPresetOverride] = useState<string | null>(null);
  const [requireAdminScript, setRequireAdminScript] = useState(false);
  const [showScriptPreview, setShowScriptPreview] = useState(false);
  const [scriptFormat, setScriptFormat] = useState<'ps1' | 'bat'>('ps1');

  useEffect(() => {
    if (!tool) return;
    const initFlags: Record<string, boolean> = {};
    const initVals: Record<string, string> = {};
    for (const p of tool.parameters ?? []) {
      initFlags[p.id] = Boolean(p.defaultActive);
      initVals[p.id] = p.defaultValue ?? '';
    }
    setActiveFlags(initFlags);
    setParamValues(initVals);
    setPresetOverride(null);
    setRequireAdminScript(tool.admin);
    setShowScriptPreview(false);
  }, [tool]);

  const assembledCommand = useMemo(() => {
    if (!tool) return '';
    if (presetOverride !== null) return presetOverride;
    return assembleCommand(tool, activeFlags, paramValues);
  }, [tool, presetOverride, activeFlags, paramValues]);

  const scriptPreviewContent = useMemo(() => {
    if (!tool) return '';
    if (scriptFormat === 'bat') {
      return generateBatchScript({
        title: tool.name,
        commands: [assembledCommand],
        requireAdmin: requireAdminScript,
        description: tool.desc,
      });
    }
    return generatePowerShellScript({
      title: tool.name,
      commands: [assembledCommand],
      requireAdmin: requireAdminScript,
      description: tool.desc,
    });
  }, [tool, scriptFormat, assembledCommand, requireAdminScript]);

  if (!tool) return null;

  const handleFlagToggle = (id: string) => {
    setPresetOverride(null);
    setActiveFlags((prev) => ({...prev, [id]: !prev[id]}));
  };

  const handleValueChange = (id: string, val: string) => {
    setPresetOverride(null);
    setActiveFlags((prev) => ({...prev, [id]: val.trim().length > 0}));
    setParamValues((prev) => ({...prev, [id]: val}));
  };

  const handleDownload = (format: 'bat' | 'ps1') => {
    const slug = tool.id.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const content =
      format === 'bat'
        ? generateBatchScript({
            title: tool.name,
            commands: [assembledCommand],
            requireAdmin: requireAdminScript,
            description: tool.desc,
          })
        : generatePowerShellScript({
            title: tool.name,
            commands: [assembledCommand],
            requireAdmin: requireAdminScript,
            description: tool.desc,
          });
    downloadTextFile(`winrun-${slug}.${format}`, content);
    onNotify(`Downloaded winrun-${slug}.${format}`);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0F1722]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {CATEGORY_META[tool.category].label}
              </span>
              <span aria-hidden="true">·</span>
              <span>{RISK_META[tool.riskLevel].label}</span>
              {tool.isCustom && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-lime-700 dark:text-lime-400">
                    Custom Tool
                  </span>
                </>
              )}
            </div>
            <h2
              id="inspector-title"
              className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              {tool.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onTogglePin(tool.id)}
              aria-label={isPinned ? 'Unpin command' : 'Pin command'}
              aria-pressed={isPinned}
              className={`rounded-lg border p-2 transition-colors ${
                isPinned
                  ? 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Star
                className="h-4 w-4"
                fill={isPinned ? 'currentColor' : 'none'}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspector"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {tool.desc}
            </p>
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                Admin note:{' '}
              </strong>
              {tool.note}
            </p>
          </div>

          {/* Live Assembled Command */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="assembled-command-output"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Command Output
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {tool.admin
                  ? 'Elevation may be required'
                  : 'Runs with standard permissions'}
              </span>
            </div>

            <div className="mt-2 flex items-stretch gap-2">
              <input
                id="assembled-command-output"
                type="text"
                readOnly
                value={assembledCommand}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-slate-300 bg-slate-950 px-3.5 py-2.5 font-mono text-sm font-medium text-lime-400 focus-visible:outline-2 focus-visible:outline-lime-500 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => onCopyText(assembledCommand, tool)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300 whitespace-nowrap shrink-0"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Curated Presets */}
          {tool.presets && tool.presets.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Presets
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tool.presets.map((preset) => {
                  const active = assembledCommand === preset.command;
                  return (
                    <button
                      key={preset.command}
                      type="button"
                      onClick={() => setPresetOverride(preset.command)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? 'border-lime-600 bg-lime-50/70 dark:border-lime-400/70 dark:bg-lime-400/10'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {preset.label}
                        </span>
                        {active && (
                          <Check className="h-3.5 w-3.5 text-lime-700 dark:text-lime-400" />
                        )}
                      </div>
                      <div className="mt-1 truncate font-mono text-xs text-slate-600 dark:text-slate-400">
                        {preset.command}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Parameter Builder */}
          {tool.parameters && tool.parameters.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Interactive Parameter Builder
                </h3>
                {presetOverride !== null && (
                  <button
                    type="button"
                    onClick={() => setPresetOverride(null)}
                    className="text-xs font-medium text-lime-700 hover:underline dark:text-lime-400"
                  >
                    Use custom flags
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-2.5">
                {tool.parameters.map((param) => {
                  const isActive = Boolean(activeFlags[param.id]);
                  return (
                    <div
                      key={param.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isActive && presetOverride === null}
                          onChange={() => handleFlagToggle(param.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-lime-600 dark:border-slate-600 dark:accent-lime-400"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {param.label}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {param.description}
                          </div>
                        </div>
                      </label>

                      {param.type === 'value' && (
                        <div className="mt-2.5 pl-7">
                          <input
                            type="text"
                            value={paramValues[param.id] ?? ''}
                            onChange={(e) =>
                              handleValueChange(param.id, e.target.value)
                            }
                            placeholder={param.placeholder ?? 'Enter value'}
                            aria-label={param.label}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Script Export (.bat / .ps1) */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Launcher Script Export
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptPreview((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{showScriptPreview ? 'Hide preview' : 'Preview script'}</span>
              </button>
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={requireAdminScript}
                onChange={(e) => setRequireAdminScript(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-lime-600 dark:border-slate-600 dark:accent-lime-400"
              />
              <span>Include Administrator elevation verification header</span>
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDownload('ps1')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download .ps1 (PowerShell)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('bat')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download .bat (Batch)</span>
              </button>
            </div>

            {showScriptPreview && (
              <div className="mt-3">
                <div className="mb-2 flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setScriptFormat('ps1')}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium ${
                      scriptFormat === 'ps1'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    .ps1
                  </button>
                  <button
                    type="button"
                    onClick={() => setScriptFormat('bat')}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium ${
                      scriptFormat === 'bat'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    .bat
                  </button>
                </div>
                <pre className="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-200 dark:border-slate-800">
                  {scriptPreviewContent}
                </pre>
              </div>
            )}
          </div>

          {/* Keywords */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Keywords:{' '}
              <span className="text-slate-700 dark:text-slate-300">
                {tool.tags.join(' · ')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {tool.isCustom && onEditCustom && onDeleteCustom ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditCustom(tool)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteCustom(tool.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Press <kbd className="font-mono">Esc</kbd> to close
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
