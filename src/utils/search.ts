import type {
  CommandTool,
  FilterCategory,
  RiskLevel,
  SortOption,
} from '../types/winrun';

export function scoreToolMatch(
  tool: CommandTool,
  rawQuery: string,
  shortcuts?: Record<string, string>
): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;

  const cleanQ = q.startsWith(':') ? q.slice(1) : q;

  // Check user-defined shortcuts manager mapping
  if (shortcuts) {
    for (const [key, toolId] of Object.entries(shortcuts)) {
      if (
        tool.id === toolId &&
        (key === q || key === cleanQ || key.includes(cleanQ))
      ) {
        return 300;
      }
    }
  }

  // Check built-in or custom tool shortcut property
  const toolShortcut = tool.shortcut ? tool.shortcut.toLowerCase() : '';
  if (
    toolShortcut &&
    (toolShortcut === q ||
      toolShortcut === cleanQ ||
      toolShortcut.includes(cleanQ))
  ) {
    return 250;
  }

  const cmd = tool.cmd.toLowerCase();
  const name = tool.name.toLowerCase();
  const desc = tool.desc.toLowerCase();
  const note = tool.note.toLowerCase();
  const tags = tool.tags.map((t) => t.toLowerCase());

  if (cmd === q) return 100;
  if (cmd.startsWith(q)) return 85;
  if (cmd.includes(q)) return 72;
  if (name.startsWith(q)) return 64;
  if (name.includes(q)) return 52;
  if (tags.some((t) => t === q)) return 46;
  if (tags.some((t) => t.includes(q))) return 36;
  if (tool.category.toLowerCase().includes(q)) return 28;
  if (tool.riskLabel.toLowerCase().includes(q)) return 24;
  if (desc.includes(q)) return 18;
  if (note.includes(q)) return 12;

  // Support multi-word token matching
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const haystack = [
      cmd,
      name,
      desc,
      note,
      ...tags,
      tool.category,
      tool.riskLabel,
    ].join(' ');
    if (tokens.every((tok) => haystack.includes(tok))) {
      return 15;
    }
  }

  return -1;
}

export function filterAndSortTools(options: {
  tools: CommandTool[];
  category: FilterCategory;
  riskFilter: RiskLevel | 'all';
  query: string;
  sort: SortOption;
  pins: string[];
  shortcuts?: Record<string, string>;
}): CommandTool[] {
  const {tools, category, riskFilter, query, sort, pins, shortcuts} = options;
  const hasQuery = query.trim().length > 0;

  const scored = tools
    .filter((tool) => {
      if (category === 'pinned' && !pins.includes(tool.id)) return false;
      if (category === 'custom' && !tool.isCustom) return false;
      if (
        category !== 'all' &&
        category !== 'pinned' &&
        category !== 'custom' &&
        tool.category !== category
      ) {
        return false;
      }
      if (riskFilter !== 'all' && tool.riskLevel !== riskFilter) return false;
      return true;
    })
    .map((tool, index) => ({
      tool,
      index,
      score: hasQuery ? scoreToolMatch(tool, query, shortcuts) : 0,
    }))
    .filter((item) => !hasQuery || item.score > 0);

  scored.sort((a, b) => {
    if (sort === 'az') {
      return a.tool.name.localeCompare(b.tool.name);
    }
    if (sort === 'risk-desc') {
      if (b.tool.riskLevel !== a.tool.riskLevel) {
        return b.tool.riskLevel - a.tool.riskLevel;
      }
      return a.tool.name.localeCompare(b.tool.name);
    }
    if (sort === 'risk-asc') {
      if (a.tool.riskLevel !== b.tool.riskLevel) {
        return a.tool.riskLevel - b.tool.riskLevel;
      }
      return a.tool.name.localeCompare(b.tool.name);
    }
    // recommended: search relevance first when searching, otherwise catalog order
    if (hasQuery && b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  return scored.map((item) => item.tool);
}
