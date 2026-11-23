import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Plus, Search, X} from 'lucide-react';
import {BUILTIN_COMMANDS, CATEGORY_META, RISK_META} from './data/commands';
import {PLAYBOOKS} from './data/playbooks';
import type {
  CommandCategory,
  CommandTool,
  FilterCategory,
  RiskLevel,
  SortOption,
  WorkspaceBackup,
  WorkspaceTab,
} from './types/winrun';
import {
  STORAGE_KEYS,
  readCustomTools,
  readPlaybookProgress,
  readStringArray,
  writeJSON,
} from './utils/storage';
import {filterAndSortTools} from './utils/search';
import {copyTextToClipboard} from './utils/scripts';
import {exportLibraryPDF} from './utils/pdf';
import {useTheme} from './hooks/useTheme';
import {TopBar} from './components/TopBar';
import {SpotlightPanel} from './components/SpotlightPanel';
import {CommandCard} from './components/CommandCard';
import {InspectorDrawer} from './components/InspectorDrawer';
import {PlaybooksView} from './components/PlaybooksView';
import {CustomToolModal} from './components/CustomToolModal';
import {BackupModal} from './components/BackupModal';
import {AdminNotesModal} from './components/AdminNotesModal';
import {OfflineIndicator} from './components/OfflineIndicator';

export default function App() {
  const {theme, toggleTheme} = useTheme();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('library');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('recommended');

  const [customTools, setCustomTools] = useState<CommandTool[]>(() =>
    readCustomTools()
  );
  const allTools = useMemo(
    () => [...customTools, ...BUILTIN_COMMANDS],
    [customTools]
  );

  const [pins, setPins] = useState<string[]>(() =>
    readStringArray(STORAGE_KEYS.pins, STORAGE_KEYS.legacyPins)
  );
  const [recent, setRecent] = useState<string[]>(() =>
    readStringArray(STORAGE_KEYS.recent, STORAGE_KEYS.legacyRecent)
  );
  const [completedPlaybookSteps, setCompletedPlaybookSteps] = useState<
    Record<string, string[]>
  >(() => readPlaybookProgress());

  const [selectedTool, setSelectedTool] = useState<CommandTool | null>(
    () => BUILTIN_COMMANDS[0] ?? null
  );
  const [inspectedTool, setInspectedTool] = useState<CommandTool | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomTool, setEditingCustomTool] =
    useState<CommandTool | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const librarySectionRef = useRef<HTMLElement>(null);

  const notify = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 2400);
  }, []);

  // Persist workspace state cleanly
  useEffect(() => {
    const validIds = new Set(allTools.map((t) => t.id));
    const validPins = pins.filter((id) => validIds.has(id));
    if (validPins.length !== pins.length) {
      setPins(validPins);
      return;
    }
    writeJSON(STORAGE_KEYS.pins, validPins);
  }, [pins, allTools]);

  useEffect(() => {
    const validIds = new Set(allTools.map((t) => t.id));
    const validRecent = recent.filter((id) => validIds.has(id));
    if (validRecent.length !== recent.length) {
      setRecent(validRecent);
      return;
    }
    writeJSON(STORAGE_KEYS.recent, validRecent);
  }, [recent, allTools]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.custom, customTools);
  }, [customTools]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.playbookSteps, completedPlaybookSteps);
  }, [completedPlaybookSteps]);

  // Layered Escape and '/' search focus keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCustomModalOpen) {
          setIsCustomModalOpen(false);
          return;
        }
        if (isBackupOpen) {
          setIsBackupOpen(false);
          return;
        }
        if (isNotesOpen) {
          setIsNotesOpen(false);
          return;
        }
        if (inspectedTool) {
          setInspectedTool(null);
          return;
        }
        if (query) {
          setQuery('');
          return;
        }
      }

      if (
        e.key === '/' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        activeTab === 'library'
      ) {
        const tag = (document.activeElement?.tagName ?? '').toUpperCase();
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isCustomModalOpen,
    isBackupOpen,
    isNotesOpen,
    inspectedTool,
    query,
    activeTab,
  ]);

  const filteredTools = useMemo(
    () =>
      filterAndSortTools({
        tools: allTools,
        category,
        riskFilter,
        query,
        sort,
        pins,
      }),
    [allTools, category, riskFilter, query, sort, pins]
  );

  const recentTools = useMemo(
    () =>
      recent
        .map((id) => allTools.find((t) => t.id === id))
        .filter((t): t is CommandTool => Boolean(t)),
    [recent, allTools]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: allTools.length,
      pinned: pins.filter((id) => allTools.some((t) => t.id === id)).length,
      custom: customTools.length,
      msc: 0,
      exe: 0,
      cpl: 0,
      settings: 0,
      cli: 0,
      shell: 0,
    };
    for (const tool of allTools) {
      counts[tool.category] += 1;
    }
    return counts;
  }, [allTools, pins, customTools.length]);

  const recordRecent = useCallback((toolId: string) => {
    setRecent((prev) => [toolId, ...prev.filter((x) => x !== toolId)].slice(0, 8));
  }, []);

  const handleCopyCommand = useCallback(
    async (commandString: string, tool?: CommandTool) => {
      const ok = await copyTextToClipboard(commandString);
      if (tool) {
        setSelectedTool(tool);
        recordRecent(tool.id);
      }
      notify(
        ok
          ? `Copied "${commandString}" — paste into Win + R or terminal`
          : 'Clipboard blocked — open Inspect to select and copy manually'
      );
    },
    [notify, recordRecent]
  );

  const handleTogglePin = useCallback(
    (id: string) => {
      setPins((prev) => {
        const exists = prev.includes(id);
        notify(exists ? 'Removed from pinned tools' : 'Pinned to shortlist');
        return exists ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [notify]
  );

  const handleInspectTool = useCallback((tool: CommandTool) => {
    setSelectedTool(tool);
    setInspectedTool(tool);
  }, []);

  const handleSaveCustomTool = (tool: CommandTool) => {
    setCustomTools((prev) => {
      const exists = prev.some((t) => t.id === tool.id);
      return exists
        ? prev.map((t) => (t.id === tool.id ? tool : t))
        : [tool, ...prev];
    });
    setSelectedTool(tool);
    if (inspectedTool?.id === tool.id) {
      setInspectedTool(tool);
    }
    setIsCustomModalOpen(false);
    setEditingCustomTool(null);
    notify(
      editingCustomTool
        ? `Updated custom command "${tool.cmd}"`
        : `Added "${tool.cmd}" to library`
    );
  };

  const handleDeleteCustomTool = (id: string) => {
    setCustomTools((prev) => prev.filter((t) => t.id !== id));
    setPins((prev) => prev.filter((p) => p !== id));
    setRecent((prev) => prev.filter((r) => r !== id));
    if (inspectedTool?.id === id) setInspectedTool(null);
    if (selectedTool?.id === id) setSelectedTool(BUILTIN_COMMANDS[0] ?? null);
    notify('Deleted custom command');
  };

  const handleTogglePlaybookStep = (playbookId: string, stepId: string) => {
    setCompletedPlaybookSteps((prev) => {
      const current = prev[playbookId] ?? [];
      const exists = current.includes(stepId);
      return {
        ...prev,
        [playbookId]: exists
          ? current.filter((id) => id !== stepId)
          : [...current, stepId],
      };
    });
  };

  const handleResetPlaybook = (playbookId: string) => {
    setCompletedPlaybookSteps((prev) => {
      const next = {...prev};
      delete next[playbookId];
      return next;
    });
    notify('Playbook checklist reset');
  };

  const handleImportBackup = (
    backup: WorkspaceBackup,
    mode: 'merge' | 'replace'
  ) => {
    if (mode === 'replace') {
      setCustomTools(backup.customTools);
      setPins(backup.pins);
      setRecent(backup.recent);
      setCompletedPlaybookSteps(backup.completedPlaybookSteps);
      notify('Workspace restored from backup');
      return;
    }

    // Merge mode
    setCustomTools((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const additions = backup.customTools.filter(
        (t) => !existingIds.has(t.id)
      );
      return [...additions, ...prev];
    });
    setPins((prev) => Array.from(new Set([...prev, ...backup.pins])));
    setRecent((prev) =>
      Array.from(new Set([...backup.recent, ...prev])).slice(0, 8)
    );
    setCompletedPlaybookSteps((prev) => {
      const merged: Record<string, string[]> = {...prev};
      for (const [pbId, steps] of Object.entries(
        backup.completedPlaybookSteps
      )) {
        merged[pbId] = Array.from(new Set([...(merged[pbId] ?? []), ...steps]));
      }
      return merged;
    });
    notify('Merged backup into current workspace');
  };

  const currentBackup: WorkspaceBackup = useMemo(
    () => ({
      schemaVersion: 4,
      exportedAt: new Date().toISOString(),
      pins,
      recent,
      customTools,
      completedPlaybookSteps,
    }),
    [pins, recent, customTools, completedPlaybookSteps]
  );

  const resetFilters = () => {
    setCategory('all');
    setRiskFilter('all');
    setQuery('');
    setSort('recommended');
    searchInputRef.current?.focus();
  };

  const categoryNavItems: {id: FilterCategory; label: string}[] = [
    {id: 'all', label: 'All commands'},
    {id: 'msc', label: '.msc Consoles'},
    {id: 'exe', label: '.exe Utilities'},
    {id: 'cpl', label: '.cpl Control Panel'},
    {id: 'settings', label: 'ms-settings URIs'},
    {id: 'cli', label: 'CLI & Recovery'},
    {id: 'shell', label: 'Shell & Folders'},
    {id: 'pinned', label: 'Pinned tools'},
    {id: 'custom', label: 'Custom tools'},
  ];

  const activeCategoryLabel =
    categoryNavItems.find((c) => c.id === category)?.label ?? 'Command library';

  return (
    <div id="top" className="min-h-screen flex flex-col">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreate={() => {
          setEditingCustomTool(null);
          setIsCustomModalOpen(true);
        }}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenNotes={() => setIsNotesOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Mobile Workspace Navigation */}
        <nav
          aria-label="Mobile navigation"
          className="flex md:hidden items-center gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
              activeTab === 'library'
                ? 'bg-slate-900 text-white dark:bg-lime-400 dark:text-slate-950'
                : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            Command Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playbooks')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
              activeTab === 'playbooks'
                ? 'bg-slate-900 text-white dark:bg-lime-400 dark:text-slate-950'
                : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            Playbooks
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCustomTool(null);
              setIsCustomModalOpen(true);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 whitespace-nowrap shrink-0"
          >
            Add Command
          </button>
          <button
            type="button"
            onClick={() => setIsBackupOpen(true)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 whitespace-nowrap shrink-0"
          >
            Backup
          </button>
          <button
            type="button"
            onClick={() => setIsNotesOpen(true)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 whitespace-nowrap shrink-0"
          >
            Admin Notes
          </button>
        </nav>

        <SpotlightPanel
          selectedTool={selectedTool}
          onCopy={(tool) => handleCopyCommand(tool.cmd, tool)}
          onInspect={handleInspectTool}
          onBrowseLibrary={() => {
            setActiveTab('library');
            setTimeout(() => {
              librarySectionRef.current?.scrollIntoView({behavior: 'smooth'});
            }, 40);
          }}
          onOpenPlaybooks={() => setActiveTab('playbooks')}
        />

        {/* Full-Width 4-Column KPI Strip */}
        <section
          aria-label="Workspace metrics"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-[#121B27]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total commands
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
              {allTools.length}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {customTools.length > 0
                ? `Includes ${customTools.length} custom`
                : 'Indexed & offline-ready'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-[#121B27]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Matching results
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
              {filteredTools.length}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Active filter view
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-[#121B27]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pinned tools
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
              {categoryCounts.pinned}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Saved shortlist
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-[#121B27]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Recently copied
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
              {recentTools.length}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Stored locally
            </div>
          </div>
        </section>

        {activeTab === 'playbooks' ? (
          <PlaybooksView
            playbooks={PLAYBOOKS}
            allTools={allTools}
            completedSteps={completedPlaybookSteps}
            onToggleStep={handleTogglePlaybookStep}
            onResetPlaybook={handleResetPlaybook}
            onCopyCommand={handleCopyCommand}
            onInspectTool={handleInspectTool}
            onNotify={notify}
          />
        ) : (
          <section
            ref={librarySectionRef}
            aria-label="Command Library Workspace"
            className="grid grid-cols-1 gap-6 lg:grid-cols-[248px_minmax(0,1fr)] items-start"
          >
            {/* Sidebar Navigation */}
            <aside className="lg:sticky lg:top-20 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#121B27]">
              <div className="px-2 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Categories
              </div>
              <nav
                aria-label="Command categories"
                className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0"
              >
                {categoryNavItems.map((item) => {
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      aria-pressed={active}
                      className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-xs transition-colors whitespace-nowrap shrink-0 lg:w-full ${
                        active
                          ? 'bg-lime-50 font-semibold text-lime-800 dark:bg-lime-400/15 dark:text-lime-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {categoryCounts[item.id]}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="my-3.5 hidden lg:block border-t border-slate-200 dark:border-slate-800" />

              {/* Risk Level Filter */}
              <div className="hidden lg:block">
                <div className="px-2 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Risk level
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setRiskFilter('all')}
                    aria-pressed={riskFilter === 'all'}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      riskFilter === 'all'
                        ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    All risk levels
                  </button>
                  {([1, 2, 3, 4] as RiskLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRiskFilter(lvl)}
                      aria-pressed={riskFilter === lvl}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                        riskFilter === lvl
                          ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {RISK_META[lvl].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-3.5 hidden lg:block border-t border-slate-200 dark:border-slate-800" />

              <div className="hidden lg:block px-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <div>
                  <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:border-slate-700 dark:bg-slate-800">
                    /
                  </kbd>{' '}
                  Focus search
                </div>
                <div className="mt-1">
                  <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:border-slate-700 dark:bg-slate-800">
                    Esc
                  </kbd>{' '}
                  Close or clear
                </div>
              </div>
            </aside>

            {/* Main Content Column */}
            <div className="min-w-0 space-y-5">
              {/* Search & Sort Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search command, task, ms-settings URI, or keyword..."
                    aria-label="Search commands"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-[#121B27] dark:text-slate-100 dark:focus:border-lime-400"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="pointer-events-none hidden sm:block absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                      Press /
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label="Sort commands"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 focus:border-lime-600 focus:outline-none dark:border-slate-700 dark:bg-[#121B27] dark:text-slate-200 dark:focus:border-lime-400"
                  >
                    <option value="recommended">Sort: Recommended</option>
                    <option value="az">Sort: A–Z</option>
                    <option value="risk-desc">Sort: Highest Risk</option>
                    <option value="risk-asc">Sort: Lowest Risk</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const title =
                        category === 'all'
                          ? 'All Commands'
                          : category === 'pinned'
                            ? 'Pinned Tools'
                            : category === 'custom'
                              ? 'Custom Tools'
                              : CATEGORY_META[category]?.label ?? 'Command Library';
                      exportLibraryPDF(filteredTools, title);
                      notify(`Exported PDF catalog (${filteredTools.length} commands)`);
                    }}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#121B27] dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <span>Export PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomTool(null);
                      setIsCustomModalOpen(true);
                    }}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#121B27] dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {/* Recently Used Strip */}
              {recentTools.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Recently copied
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setRecent([]);
                        notify('Recent history cleared');
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {recentTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleInspectTool(tool)}
                        className="min-w-[140px] shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#121B27] dark:hover:border-slate-700"
                      >
                        <div className="truncate font-mono text-xs font-semibold text-lime-700 dark:text-lime-400">
                          {tool.cmd}
                        </div>
                        <div className="truncate text-xs text-slate-600 dark:text-slate-400">
                          {tool.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active View Header */}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {activeCategoryLabel}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {query.trim()
                      ? `${filteredTools.length} matches for “${query.trim()}”`
                      : category !== 'all' &&
                          category !== 'pinned' &&
                          category !== 'custom'
                        ? CATEGORY_META[category as CommandCategory].description
                        : `${filteredTools.length} commands ready to inspect, configure, or copy`}
                  </p>
                </div>

                {(category !== 'all' || riskFilter !== 'all' || query) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-medium text-lime-700 hover:underline dark:text-lime-400"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {/* Command Grid or Empty State */}
              {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredTools.map((tool) => (
                    <CommandCard
                      key={tool.id}
                      tool={tool}
                      isPinned={pins.includes(tool.id)}
                      isSelected={selectedTool?.id === tool.id}
                      onTogglePin={handleTogglePin}
                      onCopy={(t) => handleCopyCommand(t.cmd, t)}
                      onInspect={handleInspectTool}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-[#121B27]">
                  <p className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    {category === 'custom' && customTools.length === 0
                      ? 'No custom commands yet'
                      : category === 'pinned' && pins.length === 0
                        ? 'No pinned tools yet'
                        : 'No matching commands'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {category === 'custom' && customTools.length === 0
                      ? 'Add your own frequently used Win + R paths, remote hosts, or PowerShell commands.'
                      : category === 'pinned' && pins.length === 0
                        ? 'Click the star icon on any command card to add it to your personal shortlist.'
                        : 'Try another keyword or clear your active category and risk filters.'}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    {category === 'custom' && customTools.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomTool(null);
                          setIsCustomModalOpen(true);
                        }}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-lime-400 dark:text-slate-950 dark:hover:bg-lime-300"
                      >
                        Add First Custom Command
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0B111A] dark:text-slate-400">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          WinRun Hub — Local-first Windows administration reference. Commands are
          copied or exported as scripts for you to run; nothing executes in this
          browser.
        </div>
      </footer>

      <InspectorDrawer
        tool={inspectedTool}
        isPinned={inspectedTool ? pins.includes(inspectedTool.id) : false}
        onClose={() => setInspectedTool(null)}
        onCopyText={handleCopyCommand}
        onTogglePin={handleTogglePin}
        onEditCustom={(t) => {
          setEditingCustomTool(t);
          setIsCustomModalOpen(true);
        }}
        onDeleteCustom={handleDeleteCustomTool}
        onNotify={notify}
      />

      <CustomToolModal
        isOpen={isCustomModalOpen}
        editingTool={editingCustomTool}
        onClose={() => {
          setIsCustomModalOpen(false);
          setEditingCustomTool(null);
        }}
        onSave={handleSaveCustomTool}
      />

      <BackupModal
        isOpen={isBackupOpen}
        backup={currentBackup}
        onClose={() => setIsBackupOpen(false)}
        onImport={handleImportBackup}
        onNotify={notify}
      />

      <AdminNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />

      <OfflineIndicator />

      {/* Toast Notification */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 font-mono text-xs text-white shadow-xl transition-all duration-150 dark:border-lime-400/50 dark:bg-[#121B27] dark:text-lime-300 ${
          toastVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-3 opacity-0'
        }`}
      >
        {toastMessage}
      </div>
    </div>
  );
}
