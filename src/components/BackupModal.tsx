import React, {useRef, useState} from 'react';
import {Copy, Download, Upload, X} from 'lucide-react';
import type {WorkspaceBackup} from '../types/winrun';
import {copyTextToClipboard, downloadTextFile} from '../utils/scripts';
import {validateBackupPayload} from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  backup: WorkspaceBackup;
  onClose: () => void;
  onImport: (backup: WorkspaceBackup, mode: 'merge' | 'replace') => void;
  onNotify: (message: string) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  backup,
  onClose,
  onImport,
  onNotify,
}) => {
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formattedJson = JSON.stringify(backup, null, 2);

  const handleDownloadJson = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `winrun-hub-backup-${dateStamp}.json`,
      formattedJson,
      'application/json;charset=utf-8'
    );
    onNotify('Downloaded workspace JSON backup');
  };

  const handleCopyJson = async () => {
    const ok = await copyTextToClipboard(formattedJson);
    onNotify(
      ok
        ? 'Backup JSON copied to clipboard'
        : 'Clipboard unavailable — use Download JSON instead'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportText(reader.result);
        setError('');
      }
    };
    reader.onerror = () => {
      setError('Unable to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    setError('');
    if (!importText.trim()) {
      setError('Paste backup JSON or upload a .json file first.');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setError('Invalid JSON syntax. Please check your backup file.');
      return;
    }

    const result = validateBackupPayload(parsed);
    if (!result.valid || !result.backup) {
      setError(result.error ?? 'Backup schema validation failed.');
      return;
    }

    onImport(result.backup, importMode);
    setImportText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#121B27]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="backup-modal-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Workspace Backup &amp; JSON Sync
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Move your pinned commands, recent history, custom tools, and playbook progress across devices.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close backup modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Export Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Export Current Workspace
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
              {backup.pins.length} pinned · {backup.customTools.length} custom ·{' '}
              {backup.recent.length} recent
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Backup (.json)</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy JSON</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Restore from Backup
              </h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-700 hover:underline dark:text-lime-400"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Choose .json file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-200"
              >
                {error}
              </div>
            )}

            <textarea
              rows={5}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setError('');
              }}
              placeholder='Paste exported WinRun Hub JSON here...'
              aria-label="Backup JSON input"
              className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-lime-400"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-lime-600 dark:accent-lime-400"
                  />
                  <span>Merge with current</span>
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-lime-600 dark:accent-lime-400"
                  />
                  <span>Replace current</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleApplyImport}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300"
              >
                Import Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
