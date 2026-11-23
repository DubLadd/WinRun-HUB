import type {CommandTool} from '../types/winrun';

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy textarea selection copy
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.readOnly = true;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function assembleCommand(
  tool: CommandTool,
  activeFlags: Record<string, boolean>,
  values: Record<string, string>
): string {
  if (!tool.parameters || tool.parameters.length === 0) {
    return tool.cmd;
  }

  const parts: string[] = [tool.cmd];

  for (const param of tool.parameters) {
    if (!activeFlags[param.id]) continue;

    if (param.type === 'boolean') {
      if (param.flag) {
        parts.push(param.flag);
      }
    } else {
      const val = (values[param.id] ?? param.defaultValue ?? '').trim();
      if (!val) continue;
      const needsQuotes =
        val.includes(' ') && !val.startsWith('"') && !val.startsWith("'");
      const formattedVal = needsQuotes ? `"${val}"` : val;

      if (param.flag) {
        const sep = param.separator ?? ' ';
        parts.push(`${param.flag}${sep}${formattedVal}`);
      } else {
        parts.push(formattedVal);
      }
    }
  }

  return parts.join(' ').trim();
}

function isUriOrShellLaunch(cmd: string): boolean {
  const lower = cmd.toLowerCase();
  return (
    lower.startsWith('ms-settings:') ||
    lower.startsWith('shell:') ||
    lower.includes('%temp%')
  );
}

export function generateBatchScript(options: {
  title: string;
  commands: string[];
  requireAdmin: boolean;
  description?: string;
}): string {
  const {title, commands, requireAdmin, description} = options;
  const lines: string[] = [
    '@echo off',
    'chcp 65001 >nul',
    `title WinRun Hub - ${title.replace(/[\r\n"&|<>^]/g, '')}`,
    'echo ============================================================',
    `echo  WinRun Hub Script: ${title.replace(/[\r\n"&|<>^]/g, '')}`,
  ];

  if (description) {
    lines.push(`echo  ${description.replace(/[\r\n"&|<>^]/g, '')}`);
  }
  lines.push(
    'echo ============================================================',
    'echo.'
  );

  if (requireAdmin) {
    lines.push(
      ':: Verify Administrator privileges',
      'net session >nul 2>&1',
      'if %errorLevel% neq 0 (',
      '    echo [ERROR] Administrator privileges are required for this script.',
      '    echo Right-click this .bat file and select "Run as administrator".',
      '    echo.',
      '    pause',
      '    exit /b 1',
      ')',
      'echo [OK] Running with Administrator privileges.',
      'echo.'
    );
  }

  commands.forEach((cmd, idx) => {
    const clean = cmd.trim();
    if (!clean) return;
    lines.push(`echo [${idx + 1}/${commands.length}] Executing: ${clean.replace(/[\r\n]/g, '')}`);
    if (isUriOrShellLaunch(clean)) {
      lines.push(`start "" "${clean}"`);
    } else {
      lines.push(clean);
    }
    lines.push('echo.');
  });

  lines.push('echo Script sequence completed.', 'pause');
  return lines.join('\r\n');
}

export function generatePowerShellScript(options: {
  title: string;
  commands: string[];
  requireAdmin: boolean;
  description?: string;
}): string {
  const {title, commands, requireAdmin, description} = options;
  const lines: string[] = [
    `<#`,
    `  WinRun Hub Exported Script: ${title}`,
  ];
  if (description) {
    lines.push(`  ${description}`);
  }
  lines.push(
    `  Generated: ${new Date().toISOString()}`,
    `#>`,
    ''
  );

  if (requireAdmin) {
    lines.push(
      '# Verify Administrator privileges',
      '$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())',
      'if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {',
      '    Write-Warning "Administrator privileges are required. Re-launch PowerShell as Administrator."',
      '    Read-Host "Press Enter to exit"',
      '    exit 1',
      '}',
      ''
    );
  }

  lines.push(
    `Write-Host "=== WinRun Hub: ${title.replace(/"/g, "'")} ===" -ForegroundColor Green`,
    ''
  );

  commands.forEach((cmd, idx) => {
    const clean = cmd.trim();
    if (!clean) return;
    const escapedDisplay = clean.replace(/"/g, '`"');
    lines.push(`Write-Host "[${idx + 1}/${commands.length}] Running: ${escapedDisplay}" -ForegroundColor Cyan`);

    if (clean.toLowerCase().startsWith('ms-settings:') || clean.toLowerCase().startsWith('shell:')) {
      lines.push(`Start-Process "${clean.replace(/"/g, '`"')}"`);
    } else if (clean.toLowerCase().includes('%temp%')) {
      lines.push('Start-Process explorer.exe $env:TEMP');
    } else {
      lines.push(clean);
    }
    lines.push('');
  });

  lines.push(
    'Write-Host "Completed." -ForegroundColor Green',
    'Read-Host "Press Enter to close"'
  );
  return lines.join('\n');
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
