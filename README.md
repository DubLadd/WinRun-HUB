# WinRun Hub // Command Operations Workspace

WinRun Hub is an offline-ready, local-first Windows administration workspace designed for IT technicians, power users, and system administrators. It provides a searchable command catalog, interactive parameter builder, `.bat`/`.ps1` script exporter, custom command shortcuts, troubleshooting playbooks, and schema-validated JSON backups.

---

## Features

- **Expanded Windows Catalog**: 50+ built-in commands covering `.msc` management consoles, `.exe` utilities, `.cpl` Control Panel applets, modern `ms-settings:` URIs, CLI recovery tools (`sfc`, `dism`, `chkdsk`, `ipconfig`), and special shell folders.
- **Command Shortcuts (Aliases)**: Map custom short keywords (e.g., `'wlan'`, `'rdp'`) to specific commands. Typing a shortcut in the search bar immediately promotes that tool to the top of results.
- **Interactive Parameter Builder & Script Export**: Toggle flags, configure argument values, preview generated syntax, and export standalone `.bat` or `.ps1` scripts with optional UAC elevation checks.
- **Guided Troubleshooting Playbooks**: Step-by-step diagnostic sequences for network recovery, system file repair, startup optimization, and disk cleanup, with persistent checklisted progress and **structured PDF export** using `jsPDF`.
- **Custom Commands & JSON Backup**: Add custom tools with shortcut keywords, and export or import your workspace configuration as a versioned JSON file.
- **Progressive Web App (PWA)**: Fully installable with offline Workbox precaching, custom icons, and offline connectivity awareness.

---

## Risk & Safety Classification

Every command includes a 4-tier risk level to ensure deliberate execution:
1. **Read-Only (Low impact)**: Diagnostic and reporting utilities (e.g., `eventvwr`, `msinfo32`, `dxdiag`).
2. **Moderate (Configuration change)**: Settings and adapter adjustments (e.g., `ncpa.cpl`, `powercfg`).
3. **Elevated (System or security sensitive)**: Service and policy modifications (e.g., `services.msc`, `gpedit.msc`).
4. **Critical (High impact / Data-destructive)**: Partition formatting or boot changes (e.g., `diskmgmt.msc`, `diskpart`, `chkdsk /f`).

---

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
