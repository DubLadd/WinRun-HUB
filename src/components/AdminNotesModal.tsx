import React from 'react';
import {X} from 'lucide-react';

interface AdminNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminNotesModal: React.FC<AdminNotesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-notes-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#121B27]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="admin-notes-title"
            className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            Admin Execution &amp; Keyboard Notes
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin notes"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Elevated launch from Windows Run
            </h3>
            <p className="mt-1">
              Open the Run dialog with{' '}
              <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Win + R
              </kbd>
              , paste a command, and press{' '}
              <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Ctrl + Shift + Enter
              </kbd>{' '}
              where supported to launch with Administrator elevation.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Safe operational habits
            </h3>
            <p className="mt-1">
              Tools classified as <strong>Elevated</strong> or{' '}
              <strong>Critical</strong> (Registry Editor, Disk Management,
              DiskPart, Services, and boot configuration) modify core OS state.
              Export registry keys or back up volumes before making irreversible
              changes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Windows edition availability
            </h3>
            <p className="mt-1">
              Snap-ins like <code className="font-mono text-xs">gpedit.msc</code>{' '}
              and <code className="font-mono text-xs">lusrmgr.msc</code> are
              included on Windows Pro, Enterprise, and Education, but omitted
              on Windows Home.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              Workspace shortcuts
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-2 font-mono text-slate-600 dark:text-slate-300">
              <div>/ — Focus search</div>
              <div>Esc — Close panel / clear</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
