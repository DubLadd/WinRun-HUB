import {jsPDF} from 'jspdf';
import type {CommandTool, Playbook} from '../types/winrun';

export function exportPlaybookPDF(playbook: Playbook): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header banner background
  doc.setFillColor(18, 27, 39); // #121B27 dark navy
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(132, 204, 22); // lime green accent
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('WINRUN HUB // TROUBLESHOOTING PLAYBOOK', margin, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(playbook.title, margin, 32);

  y = 58;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Category: ${playbook.category}  |  Severity: ${playbook.severity}  |  Est. Time: ~${playbook.estimatedMinutes} min`,
    margin,
    y
  );

  y += 10;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(
    playbook.summary,
    pageWidth - margin * 2
  );
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 6 + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Step-by-Step Recovery Sequence', margin, y);
  y += 8;

  playbook.steps.forEach((step, idx) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Step ${idx + 1}: ${step.title}`, margin + 4, y + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52); // command dark green
    doc.text(`Command: ${step.command}`, margin + 4, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Outcome: ${step.expectedOutcome}`, margin + 4, y + 21);

    y += 32;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `WinRun Hub Playbook Export — Generated ${new Date().toLocaleDateString()} (Page ${i} of ${pageCount})`,
      margin,
      285
    );
  }

  doc.save(`playbook-${playbook.id}.pdf`);
}

export function exportLibraryPDF(
  tools: CommandTool[],
  categoryTitle: string
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFillColor(18, 27, 39);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(132, 204, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('WINRUN HUB // COMMAND CATALOG EXPORT', margin, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`View: ${categoryTitle} (${tools.length} commands)`, margin, 30);

  y = 52;

  tools.forEach((tool, idx) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${tool.name}`, margin + 4, y + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text(tool.cmd, pageWidth - margin - 4, y + 6, {align: 'right'});

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const descLine =
      tool.desc.length > 95 ? tool.desc.slice(0, 92) + '...' : tool.desc;
    doc.text(descLine, margin + 4, y + 15);

    y += 26;
  });

  doc.save('winrun-command-catalog.pdf');
}
