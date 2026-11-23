import React, {useState} from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  Download,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import type {CommandTool, Playbook} from '../types/winrun';
import {
  downloadTextFile,
  generateBatchScript,
  generatePowerShellScript,
} from '../utils/scripts';
import {exportPlaybookPDF} from '../utils/pdf';

interface PlaybooksViewProps {
  playbooks: Playbook[];
  allTools: CommandTool[];
  completedSteps: Record<string, string[]>;
  onToggleStep: (playbookId: string, stepId: string) => void;
  onResetPlaybook: (playbookId: string) => void;
  onCopyCommand: (command: string, linkedTool?: CommandTool) => void;
  onInspectTool: (tool: CommandTool) => void;
  onNotify: (message: string) => void;
}

export const PlaybooksView: React.FC<PlaybooksViewProps> = ({
  playbooks,
  allTools,
  completedSteps,
  onToggleStep,
  onResetPlaybook,
  onCopyCommand,
  onInspectTool,
  onNotify,
}) => {
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>(
    playbooks[0]?.id ?? ''
  );

  const activePlaybook =
    playbooks.find((p) => p.id === selectedPlaybookId) ?? playbooks[0];

  if (!activePlaybook) return null;

  const doneIds = completedSteps[activePlaybook.id] ?? [];
  const completedCount = activePlaybook.steps.filter((s) =>
    doneIds.includes(s.id)
  ).length;
  const totalSteps = activePlaybook.steps.length;

  const handleExportPlaybook = (format: 'ps1' | 'bat') => {
    const commands = activePlaybook.steps.map((s) => s.command);
    const requiresAdmin = activePlaybook.steps.some((s) => s.requiresAdmin);
    const content =
      format === 'bat'
        ? generateBatchScript({
            title: activePlaybook.title,
            commands,
            requireAdmin: requiresAdmin,
            description: activePlaybook.summary,
          })
        : generatePowerShellScript({
            title: activePlaybook.title,
            commands,
            requireAdmin: requiresAdmin,
            description: activePlaybook.summary,
          });
    downloadTextFile(`playbook-${activePlaybook.id}.${format}`, content);
    onNotify(`Exported playbook-${activePlaybook.id}.${format}`);
  };

  return (
    <section
      aria-label="Troubleshooting Playbooks"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
    >
      {/* Left Playbook List */}
      <aside className="lg:col-span-4 space-y-3">
        <div className="px-1">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Diagnostic Playbooks
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Ordered Windows recovery sequences with per-step checklists and batch/PowerShell export.
          </p>
        </div>

        <div className="space-y-2">
          {playbooks.map((pb) => {
            const pbDone = (completedSteps[pb.id] ?? []).filter((id) =>
              pb.steps.some((st) => st.id === id)
            ).length;
            const isSelected = pb.id === activePlaybook.id;

            return (
              <button
                key={pb.id}
                type="button"
                onClick={() => setSelectedPlaybookId(pb.id)}
                aria-pressed={isSelected}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-lime-600 bg-lime-50/70 dark:border-lime-400/70 dark:bg-lime-400/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#121B27] dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {pb.category} · {pb.severity}
                  </span>
                  <span className="font-mono tabular-nums">
                    {pbDone}/{pb.steps.length}
                  </span>
                </div>
                <div className="mt-1.5 font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {pb.title}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {pb.summary}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Active Playbook Detail */}
      <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121B27]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{activePlaybook.category}</span>
              <span aria-hidden="true">·</span>
              <span>{activePlaybook.severity}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                ~{activePlaybook.estimatedMinutes} min
              </span>
            </div>
            <h3 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              {activePlaybook.title}
            </h3>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              {activePlaybook.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                exportPlaybookPDF(activePlaybook);
                onNotify(`Exported PDF for ${activePlaybook.title}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-lime-700/30 bg-lime-50 px-3 py-1.5 text-xs font-semibold text-lime-900 hover:bg-lime-100 dark:border-lime-400/40 dark:bg-lime-400/10 dark:text-lime-300 dark:hover:bg-lime-400/20"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportPlaybook('ps1')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export .ps1</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportPlaybook('bat')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export .bat</span>
            </button>
          </div>
        </div>

        {/* Progress Header */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Progress:{' '}
            <span className="font-mono font-semibold text-slate-900 tabular-nums dark:text-lime-400">
              {completedCount} / {totalSteps} steps verified
            </span>
          </div>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => onResetPlaybook(activePlaybook.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Reset checklist</span>
            </button>
          )}
        </div>

        {/* Steps */}
        <ol className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {activePlaybook.steps.map((step, index) => {
            const checked = doneIds.includes(step.id);
            const linkedTool = step.linkedToolId
              ? allTools.find((t) => t.id === step.linkedToolId)
              : undefined;

            return (
              <li key={step.id} className="py-4 first:pt-2 last:pb-0">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleStep(activePlaybook.id, step.id)}
                    aria-label={
                      checked
                        ? `Mark step ${index + 1} incomplete`
                        : `Mark step ${index + 1} complete`
                    }
                    aria-pressed={checked}
                    className={`mt-0.5 shrink-0 transition-colors ${
                      checked
                        ? 'text-lime-700 dark:text-lime-400'
                        : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200'
                    }`}
                  >
                    {checked ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4
                        className={`text-sm font-semibold ${
                          checked
                            ? 'text-slate-500 line-through dark:text-slate-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}. {step.title}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {step.requiresAdmin ? 'Admin required' : 'Standard'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {step.instruction}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <code className="rounded-md border border-slate-200 bg-slate-950 px-2.5 py-1 font-mono text-xs text-lime-400 dark:border-slate-700">
                        {step.command}
                      </code>
                      <button
                        type="button"
                        onClick={() => onCopyCommand(step.command, linkedTool)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        <span>Copy</span>
                      </button>
                      {linkedTool && (
                        <button
                          type="button"
                          onClick={() => onInspectTool(linkedTool)}
                          className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        >
                          <SlidersHorizontal
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          <span>Inspect</span>
                        </button>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <strong className="font-medium text-slate-700 dark:text-slate-300">
                        Expected outcome:{' '}
                      </strong>
                      {step.expectedOutcome}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
