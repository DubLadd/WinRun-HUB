export type CommandCategory = 'msc' | 'exe' | 'cpl' | 'settings' | 'cli' | 'shell';

export type FilterCategory = 'all' | 'pinned' | 'custom' | CommandCategory;

export type RiskLevel = 1 | 2 | 3 | 4;

export type SortOption = 'recommended' | 'az' | 'risk-desc' | 'risk-asc';

export type WorkspaceTab = 'library' | 'playbooks';

export interface CommandParameter {
  id: string;
  flag: string;
  label: string;
  description: string;
  type: 'boolean' | 'value';
  defaultActive?: boolean;
  placeholder?: string;
  defaultValue?: string;
  separator?: string;
}

export interface CommandPreset {
  label: string;
  command: string;
  description: string;
}

export interface CommandTool {
  id: string;
  cmd: string;
  name: string;
  category: CommandCategory;
  desc: string;
  note: string;
  tags: string[];
  admin: boolean;
  riskLevel: RiskLevel;
  riskLabel: string;
  parameters?: CommandParameter[];
  presets?: CommandPreset[];
  shortcut?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface PlaybookStep {
  id: string;
  title: string;
  command: string;
  linkedToolId?: string;
  instruction: string;
  expectedOutcome: string;
  requiresAdmin: boolean;
}

export interface Playbook {
  id: string;
  title: string;
  category: string;
  summary: string;
  severity: 'Routine' | 'Diagnostic' | 'Recovery';
  estimatedMinutes: number;
  steps: PlaybookStep[];
}

export interface WorkspaceBackup {
  schemaVersion: number;
  exportedAt: string;
  pins: string[];
  recent: string[];
  customTools: CommandTool[];
  completedPlaybookSteps: Record<string, string[]>;
}
