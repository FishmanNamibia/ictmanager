/**
 * Executive PDF Report Generator - Modern, Visual Format
 * Generates professional executive reports with charts and graphs
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

type AttentionLevel = 'low' | 'medium' | 'high' | 'critical';
type ConfidenceLevel = 'high' | 'moderate' | 'low';

export async function generateExecutivePdfReport(reportData: any): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = () => doc.page.margins.left;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  // Color scheme
  const colors = {
    primary: '#1a365d',
    secondary: '#2c5282',
    success: '#2f855a',
    warning: '#d69e2e',
    danger: '#c53030',
    muted: '#718096',
    light: '#edf2f7',
    white: '#ffffff',
  };

  const statusColors = {
    good: colors.success,
    warning: colors.warning,
    critical: colors.danger,
  };

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const ensureSpace = (height: number) => {
    if (doc.y + height > bottom()) doc.addPage();
  };

  const heading1 = (text: string, color = colors.primary) => {
    ensureSpace(40);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(18).fillColor(color).text(text, left(), doc.y);
    doc.moveDown(0.3);
  };

  const heading2 = (text: string, color = colors.secondary) => {
    ensureSpace(30);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(color).text(text, left(), doc.y);
    doc.moveDown(0.2);
  };

  const heading3 = (text: string, color = colors.secondary) => {
    ensureSpace(25);
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(color).text(text, left(), doc.y);
    doc.moveDown(0.15);
  };

  const paragraph = (text: string, color = '#2d3748') => {
    ensureSpace(30);
    doc.font('Helvetica').fontSize(10).fillColor(color).text(text, left(), doc.y, { width, lineGap: 2, align: 'left' });
    doc.moveDown(0.3);
  };

  const bulletList = (items: string[], color = '#2d3748') => {
    items.forEach(item => {
      ensureSpace(25);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary).text('•', left(), y);
      doc.font('Helvetica').fontSize(10).fillColor(color).text(item, left() + 15, y, { width: width - 15, lineGap: 2 });
      doc.moveDown(0.2);
    });
  };

  const statusBadge = (status: string, x: number, y: number) => {
    const badgeColor = status.includes('Risk') || status.includes('Critical') ? colors.danger :
                       status.includes('Watch') || status.includes('Warning') ? colors.warning :
                       colors.success;
    
    doc.roundedRect(x, y, 180, 28, 6).fillAndStroke(badgeColor, badgeColor);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.white).text(status, x, y + 8, { width: 180, align: 'center' });
  };

  const drawTable = (headers: string[], rows: string[][], columnWidths: number[]) => {
    const rowHeight = 24;
    const headerHeight = 28;
    
    ensureSpace(headerHeight + rows.length * rowHeight + 20);
    
    const startY = doc.y;
    let currentX = left();
    
    // Header
    doc.roundedRect(left(), startY, width, headerHeight, 4).fill(colors.primary);
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.white).text(
        header,
        currentX + 8,
        startY + 8,
        { width: columnWidths[i] - 16, align: 'left' }
      );
      currentX += columnWidths[i];
    });
    
    // Rows
    let currentY = startY + headerHeight;
    rows.forEach((row, rowIndex) => {
      currentX = left();
      const fillColor = rowIndex % 2 === 0 ? colors.white : colors.light;
      doc.rect(left(), currentY, width, rowHeight).fill(fillColor);
      
      row.forEach((cell, cellIndex) => {
        doc.font('Helvetica').fontSize(9).fillColor('#2d3748').text(
          cell,
          currentX + 8,
          currentY + 6,
          { width: columnWidths[cellIndex] - 16, align: 'left' }
        );
        currentX += columnWidths[cellIndex];
      });
      
      currentY += rowHeight;
    });
    
    doc.y = currentY + 10;
  };

  const drawBarChart = (title: string, data: Array<{ label: string; value: number; color?: string }>, maxValue?: number) => {
    ensureSpace(180);
    
    heading3(title);
    
    const chartHeight = 120;
    const barHeight = 18;
    const labelWidth = 150;
    const chartStartY = doc.y;
    
    const max = maxValue || Math.max(...data.map(d => d.value), 1);
    
    data.forEach((item, index) => {
      const y = chartStartY + index * (barHeight + 8);
      const barWidth = ((width - labelWidth - 40) * item.value) / max;
      
      // Label
      doc.font('Helvetica').fontSize(9).fillColor('#2d3748').text(item.label, left(), y + 4, { width: labelWidth });
      
      // Bar background
      doc.roundedRect(left() + labelWidth + 10, y, width - labelWidth - 40, barHeight, 4).fill('#e2e8f0');
      
      // Bar
      if (barWidth > 0) {
        doc.roundedRect(left() + labelWidth + 10, y, barWidth, barHeight, 4).fill(item.color || colors.primary);
      }
      
      // Value
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#2d3748').text(
        String(item.value),
        left() + width - 25,
        y + 4,
        { width: 25, align: 'right' }
      );
    });
    
    doc.y = chartStartY + data.length * (barHeight + 8) + 15;
  };

  const drawPieChart = (title: string, data: Array<{ label: string; value: number; color: string }>) => {
    ensureSpace(200);
    
    heading3(title);
    
    const centerX = left() + 100;
    const centerY = doc.y + 80;
    const radius = 60;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      paragraph('No data available');
      return;
    }
    
    let startAngle = -Math.PI / 2;
    
    data.forEach(item => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      
      doc.moveTo(centerX, centerY);
      doc.fillColor(item.color);
      doc.arc(centerX, centerY, radius, startAngle, endAngle).fill();
      
      startAngle = endAngle;
    });
    
    // Legend
    let legendY = doc.y;
    data.forEach((item, index) => {
      const legendX = left() + 220;
      const itemY = legendY + index * 20;
      
      doc.rect(legendX, itemY, 12, 12).fill(item.color);
      doc.font('Helvetica').fontSize(9).fillColor('#2d3748').text(
        `${item.label}: ${item.value} (${Math.round((item.value / total) * 100)}%)`,
        legendX + 18,
        itemY,
        { width: width - 240 }
      );
    });
    
    doc.y = legendY + data.length * 20 + 20;
  };

  const drawInfoBox = (title: string, content: string, bgColor = colors.light, borderColor = colors.primary) => {
    ensureSpace(60);
    
    const boxHeight = 50 + doc.heightOfString(content, { width: width - 40 });
    
    doc.roundedRect(left(), doc.y, width, boxHeight, 8).fillAndStroke(bgColor, borderColor);
    
    const boxY = doc.y;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary).text(title, left() + 20, boxY + 15, { width: width - 40 });
    doc.font('Helvetica').fontSize(10).fillColor('#2d3748').text(content, left() + 20, boxY + 35, { width: width - 40, lineGap: 2 });
    
    doc.y = boxY + boxHeight + 15;
  };

  // ============ START REPORT ============

  // Cover Page
  doc.rect(0, 0, doc.page.width, 200).fill(colors.primary);
  doc.font('Helvetica-Bold').fontSize(28).fillColor(colors.white).text(
    'ICT EXECUTIVE REPORT',
    left(),
    80,
    { width, align: 'center' }
  );
  
  const reportDate = new Date(reportData.generatedAt);
  doc.font('Helvetica').fontSize(14).fillColor(colors.white).text(
    `Date: ${reportDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    left(),
    140,
    { width, align: 'center' }
  );

  doc.y = 250;

  // Overall Status Badge
  const overallStatus = reportData.headline.posture === 'stable' ? '🟢 Stable' :
                       reportData.headline.posture === 'watch' ? '🟡 Watch' :
                       '🔴 At Risk';
  
  const dataConfidenceNote = reportData.sections.filter((s: any) => s.dataConfidence.level === 'low').length > 0 ?
    ' (Data Confidence Constrained)' : '';
  
  statusBadge(`Overall Status: ${overallStatus}${dataConfidenceNote}`, left() + (width - 180) / 2, doc.y);
  doc.moveDown(3);

  // 1. Executive Summary
  heading1('1. Executive Summary');
  paragraph(reportData.headline.summary);
  doc.moveDown(0.5);

  // Performance Score
  heading3('ICT Performance Score');
  const scoreData = [
    { label: 'Current Score', value: reportData.headline.ictPerformanceScore, color: statusColors.good },
    { label: 'Target', value: 100, color: '#cbd5e0' }
  ];
  drawBarChart('', scoreData, 100);

  doc.addPage();

  // 2. Key Issues Identified
  heading1('2. Key Issues Identified');
  
  const keyIssues = reportData.sections.flatMap((section: any) => 
    section.keyRisks.map((risk: string) => `${section.title}: ${risk}`)
  ).slice(0, 6);
  
  if (keyIssues.length > 0) {
    bulletList(keyIssues);
  } else {
    paragraph('No critical issues identified at this time.');
  }
  
  doc.moveDown(0.5);

  // Issues by Category Chart
  const issuesByCategory = reportData.sections.map((section: any) => ({
    label: section.title.substring(0, 25),
    value: section.keyRisks.length,
    color: section.boardAttentionLevel === 'high' || section.boardAttentionLevel === 'critical' ? colors.danger :
           section.boardAttentionLevel === 'medium' ? colors.warning : colors.success
  })).filter((item: any) => item.value > 0);

  if (issuesByCategory.length > 0) {
    drawBarChart('Issues by Category', issuesByCategory);
  }

  // 3. Key Risks to the Organisation
  heading1('3. Key Risks to the Organisation');
  
  if (reportData.topRisks.length > 0) {
    bulletList(reportData.topRisks);
  } else {
    paragraph('No major risks identified. Continue monitoring operational metrics.');
  }

  doc.moveDown(0.5);

  // Risk Distribution Pie Chart
  const riskDistribution = [
    { label: 'High Priority', value: reportData.sections.filter((s: any) => s.boardAttentionLevel === 'high' || s.boardAttentionLevel === 'critical').length, color: colors.danger },
    { label: 'Medium Priority', value: reportData.sections.filter((s: any) => s.boardAttentionLevel === 'medium').length, color: colors.warning },
    { label: 'Low Priority', value: reportData.sections.filter((s: any) => s.boardAttentionLevel === 'low').length, color: colors.success }
  ].filter(item => item.value > 0);

  if (riskDistribution.length > 0) {
    drawPieChart('Risk Distribution by Priority', riskDistribution);
  }

  doc.addPage();

  // 4. Decisions Required from EXCO
  heading1('4. Decisions Required from EXCO');
  
  if (reportData.decisionsRequired && reportData.decisionsRequired.length > 0) {
    bulletList(reportData.decisionsRequired);
  } else {
    paragraph('No immediate executive decisions required. Continue with current strategic direction.');
  }

  doc.moveDown(1);

  // 5. Immediate Management Priorities
  heading1('5. Immediate Management Priorities');
  
  const priorities = reportData.managementActionRegister.slice(0, 6);
  
  if (priorities.length > 0) {
    const headers = ['Priority Area', 'Action'];
    const rows = priorities.map((item: any) => [
      item.issue,
      item.recommendedAction.substring(0, 80) + (item.recommendedAction.length > 80 ? '...' : '')
    ]);
    const columnWidths = [width * 0.35, width * 0.65];
    
    drawTable(headers, rows, columnWidths);
  } else {
    paragraph('No urgent management actions required at this time.');
  }

  doc.addPage();

  // 6. Detailed Section Analysis
  heading1('6. Detailed Analysis by Domain');
  
  reportData.sections.forEach((section: any, index: number) => {
    if (index > 0 && index % 2 === 0) doc.addPage();
    
    heading2(`${index + 1}. ${section.title}`);
    
    // Summary
    paragraph(section.summary);
    
    // Key Metrics Chart
    if (section.keyMetrics && section.keyMetrics.length > 0) {
      const metricsData = section.keyMetrics.map((m: any) => ({
        label: m.label,
        value: typeof m.value === 'number' ? m.value : parseInt(String(m.value).replace(/[^0-9]/g, '')) || 0,
        color: m.status === 'good' ? colors.success : m.status === 'warning' ? colors.warning : colors.danger
      }));
      
      drawBarChart(`${section.title} - Key Metrics`, metricsData);
    }
    
    // Risks
    if (section.keyRisks && section.keyRisks.length > 0) {
      heading3('Key Risks');
      bulletList(section.keyRisks, colors.danger);
    }
    
    // Recommendations
    if (section.recommendations && section.recommendations.length > 0) {
      heading3('Recommendations');
      bulletList(section.recommendations);
    }
    
    doc.moveDown(0.5);
  });

  doc.addPage();

  // 7. Data Confidence Statement
  heading1('7. Data Confidence Statement');
  
  const lowConfidenceSections = reportData.sections.filter((s: any) => s.dataConfidence.level === 'low');
  const moderateConfidenceSections = reportData.sections.filter((s: any) => s.dataConfidence.level === 'moderate');
  
  if (lowConfidenceSections.length > 0 || moderateConfidenceSections.length > 0) {
    drawInfoBox(
      '⚠️ Data Quality Notice',
      `Current reporting is based on ${lowConfidenceSections.length > 0 ? 'limited and incomplete' : 'partially complete'} data sources in ${lowConfidenceSections.length + moderateConfidenceSections.length} domain(s). Zero or low values may indicate lack of visibility rather than low risk. Management will prioritize data integration and reporting completeness.`,
      '#fff5f5',
      colors.danger
    );
    
    if (lowConfidenceSections.length > 0) {
      heading3('Areas with Low Data Confidence:');
      bulletList(lowConfidenceSections.map((s: any) => s.title));
    }
  } else {
    drawInfoBox(
      '✓ Data Quality Assurance',
      'Current reporting is based on comprehensive and reliable data sources across all domains. Metrics and insights can be used with high confidence for decision-making.',
      '#f0fff4',
      colors.success
    );
  }

  doc.moveDown(1);

  // 8. Way Forward
  heading1('8. Way Forward');
  
  paragraph('The focus for the next reporting cycle will be:');
  doc.moveDown(0.3);
  
  const wayForward = [
    ...reportData.recommendations.slice(0, 3),
    'Monitoring progress on identified management actions',
    'Improving data integration and reporting quality',
    'Strengthening governance and compliance controls'
  ];
  
  bulletList(wayForward);

  // Footer on all pages
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor(colors.muted).text(
      `ICT Executive Report | Page ${i + 1} of ${range.count} | Generated ${reportDate.toLocaleDateString('en-GB')}`,
      left(),
      doc.page.height - 30,
      { width, align: 'center' }
    );
  }

  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.end();
  });
}
