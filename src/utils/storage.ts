import type {
  CommandCategory,
  CommandTool,
  RiskLevel,
  WorkspaceBackup,
} from '../types/winrun';

export const STORAGE_KEYS = {
  pins: 'winrun.v4.pins',
  recent: 'winrun.v4.recent',
  custom: 'winrun.v4.custom',
  playbookSteps: 'winrun.v4.playbookSteps',
  theme: 'winrun.v4.theme',
  legacyPins: 'winrun.v3.pins',
  legacyRecent: 'winrun.v3.recent',
} as const;

const VALID_CATEGORIES = new Set<CommandCategory>([
  'msc',
  'exe',
  'cpl',
  'settings',
  'cli',
  'shell',
]);

export function readStringArray(key: string, legacyKey?: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    }
    if (legacyKey) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw !== null) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (item): item is string => typeof item === 'string'
          );
          localStorage.setItem(key, JSON.stringify(clean));
          return clean;
        }
      }
    }
  } catch {
    return [];
  }
  return [];
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or restricted-context errors cleanly
  }
}

export function sanitizeCustomTool(raw: unknown): CommandTool | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const cmd = typeof obj.cmd === 'string' ? obj.cmd.trim() : '';
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (!cmd || !name) return null;

  const category: CommandCategory = VALID_CATEGORIES.has(
    obj.category as CommandCategory
  )
    ? (obj.category as CommandCategory)
    : 'exe';

  const rawRisk = Number(obj.riskLevel);
  const riskLevel: RiskLevel =
    rawRisk === 1 || rawRisk === 2 || rawRisk === 3 || rawRisk === 4
      ? rawRisk
      : 2;

  const riskLabelMap: Record<RiskLevel, string> = {
    1: 'Read-Only',
    2: 'Moderate',
    3: 'Elevated',
    4: 'Critical',
  };

  const id =
    typeof obj.id === 'string' && obj.id.trim().length > 0
      ? obj.id.trim()
      : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const tags = Array.isArray(obj.tags)
    ? obj.tags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const shortcut =
    typeof obj.shortcut === 'string' && obj.shortcut.trim().length > 0
      ? obj.shortcut.trim().toLowerCase()
      : undefined;

  return {
    id,
    cmd,
    name,
    category,
    desc:
      typeof obj.desc === 'string' && obj.desc.trim()
        ? obj.desc.trim()
        : 'Custom user-defined Windows command.',
    note:
      typeof obj.note === 'string' && obj.note.trim()
        ? obj.note.trim()
        : 'Verify command arguments and elevation requirements before running.',
    tags: tags.length > 0 ? tags : ['custom'],
    admin: Boolean(obj.admin),
    riskLevel,
    riskLabel:
      typeof obj.riskLabel === 'string' && obj.riskLabel.trim()
        ? obj.riskLabel.trim()
        : riskLabelMap[riskLevel],
    shortcut,
    isCustom: true,
    createdAt:
      typeof obj.createdAt === 'string'
        ? obj.createdAt
        : new Date().toISOString(),
  };
}

export function readCustomTools(): CommandTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.custom);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeCustomTool)
      .filter((t): t is CommandTool => t !== null);
  } catch {
    return [];
  }
}

export function readPlaybookProgress(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.playbookSteps);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const clean: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        clean[k] = v.filter((s): s is string => typeof s === 'string');
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function validateBackupPayload(input: unknown): {
  valid: boolean;
  error?: string;
  backup?: WorkspaceBackup;
} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {valid: false, error: 'Backup must be a valid JSON object.'};
  }
  const obj = input as Record<string, unknown>;
  if (!Array.isArray(obj.pins) && !Array.isArray(obj.customTools)) {
    return {
      valid: false,
      error: 'Unrecognized backup format: missing pins or customTools arrays.',
    };
  }

  const pins = Array.isArray(obj.pins)
    ? obj.pins.filter((p): p is string => typeof p === 'string')
    : [];
  const recent = Array.isArray(obj.recent)
    ? obj.recent.filter((r): r is string => typeof r === 'string')
    : [];
  const customTools = Array.isArray(obj.customTools)
    ? obj.customTools
        .map(sanitizeCustomTool)
        .filter((t): t is CommandTool => t !== null)
    : [];

  const completedPlaybookSteps: Record<string, string[]> = {};
  if (
    obj.completedPlaybookSteps &&
    typeof obj.completedPlaybookSteps === 'object' &&
    !Array.isArray(obj.completedPlaybookSteps)
  ) {
    for (const [k, v] of Object.entries(
      obj.completedPlaybookSteps as Record<string, unknown>
    )) {
      if (Array.isArray(v)) {
        completedPlaybookSteps[k] = v.filter(
          (s): s is string => typeof s === 'string'
        );
      }
    }
  }

  return {
    valid: true,
    backup: {
      schemaVersion:
        typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 4,
      exportedAt:
        typeof obj.exportedAt === 'string'
          ? obj.exportedAt
          : new Date().toISOString(),
      pins,
      recent,
      customTools,
      completedPlaybookSteps,
    },
  };
}
