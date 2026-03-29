/**
 * Modern Executive PDF Report Generator
 * Professional, visual report with charts and comprehensive data
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

interface ExecutiveData {
  headline: {
    posture: 'stable' | 'watch' | 'critical';
    ictPerformanceScore: number;
    summary: string;
  };
  executiveSummary: {
    overallInstitutionalIctPosture: string;
    keyAchievementsThisPeriod: string[];
    topRisksAndWatchItems: string[];
    majorDecisionsRequiredFromManagement: string[];
    urgentManagementActions: string[];
  };
  sections: Array<{
    title: string;
    summary: string;
    keyMetrics: Array<{
      label: string;
      value: string | number;
      status: 'good' | 'warning' | 'critical';
    }>;
    keyRisks: string[];
    recommendations: string[];
    boardAttentionLevel: 'low' | 'medium' | 'high' | 'critical';
    dataConfidence: {
      level: 'high' | 'moderate' | 'low';
      narrative: string;
    };
  }>;
  topRisks: string[];
  watchItems: string[];
  decisionsRequired: string[];
  recommendations: string[];
  managementActionRegister: Array<{
    issue: string;
    explanation: string;
    businessImpact: string;
    recommendedAction: string;
    owner: string;
    dueDate: string;
    priority: string;
    status: string;
    escalationRequired: boolean;
  }>;
  generatedAt: string;
}

export async function generateModernExecutivePdf(data: ExecutiveData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = () => doc.page.margins.left;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  // Modern color palette
  const colors = {
    primary: '#1976d2',
    secondary: '#2e7d32',
    accent: '#ed6c02',
    danger: '#d32f2f',
    warning: '#f57c00',
    info: '#0288d1',
    success: '#2e7d32',
    grey: '#616161',
    light: '#f5f5f5',
    white: '#ffffff',
    dark: '#212121',
  };

  const statusColors = {
    good: colors.success,
    warning: colors.warning,
    critical: colors.danger,
    stable: colors.success,
    watch: colors.warning,
    high: colors.danger,
    medium: colors.warning,
    low: colors.info,
  };

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const ensureSpace = (height: number) => {
    if (doc.y + height > bottom()) doc.addPage();
  };

  const heading1 = (text: string, color = colors.primary) => {
    ensureSpace(40);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(20).fillColor(color).text(text, left(), doc.y);
    doc.moveDown(0.3);
  };

  const heading2 = (text: string, color = colors.primary) => {
    ensureSpace(30);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(color).text(text, left(), doc.y);
    doc.moveDown(0.2);
  };

  const heading3 = (text: string, color = colors.dark) => {
    ensureSpace(25);
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(color).text(text, left(), doc.y);
    doc.moveDown(0.15);
  };

  const paragraph = (text: string, color = colors.dark) => {
    ensureSpace(30);
    doc.font('Helvetica').fontSize(11).fillColor(color).text(text, left(), doc.y, { width, lineGap: 2 });
    doc.moveDown(0.3);
  };

  const bulletList = (items: string[], color = colors.dark) => {
    items.forEach(item => {
      ensureSpace(25);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary).text('•', left(), y);
      doc.font('Helvetica').fontSize(11).fillColor(color).text(item, left() + 15, y, { width: width - 15, lineGap: 2 });
      doc.moveDown(0.2);
    });
  };

  const statusBadge = (status: string, x: number, y: number, width = 150) => {
    const badgeColor = statusColors[status as keyof typeof statusColors] || colors.grey;
    doc.roundedRect(x, y, width, 30, 6).fill(badgeColor);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.white).text(
      status.toUpperCase(),
      x,
      y + 8,
      { width, align: 'center' }
    );
  };

  const metricCard = (title: string, value: string, status: string, x: number, y: number, cardWidth: number) => {
    const cardHeight = 80;
    const statusColor = statusColors[status as keyof typeof statusColors] || colors.grey;
    
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke(colors.white, statusColor);
    doc.rect(x, y, cardWidth, 4).fill(statusColor);
    
    doc.font('Helvetica').fontSize(10).fillColor(colors.grey).text(title, x + 10, y + 15, { width: cardWidth - 20 });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.dark).text(value, x + 10, y + 35, { width: cardWidth - 20 });
  };

  const drawBarChart = (title: string, data: Array<{ label: string; value: number; color?: string }>, maxValue?: number) => {
    ensureSpace(180);
    heading3(title);
    
    const chartHeight = 120;
    const barHeight = 20;
    const labelWidth = 160;
    const chartStartY = doc.y;
    
    const max = maxValue || Math.max(...data.map(d => d.value), 1);
    
    data.forEach((item, index) => {
      const y = chartStartY + index * (barHeight + 10);
      const barWidth = ((width - labelWidth - 40) * item.value) / max;
      
      // Label
      doc.font('Helvetica').fontSize(10).fillColor(colors.dark).text(item.label, left(), y + 4, { width: labelWidth });
      
      // Bar background
      doc.roundedRect(left() + labelWidth + 10, y, width - labelWidth - 40, barHeight, 4).fill(colors.light);
      
      // Bar
      if (barWidth > 0) {
        doc.roundedRect(left() + labelWidth + 10, y, barWidth, barHeight, 4).fill(item.color || colors.primary);
      }
      
      // Value
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.dark).text(
        String(item.value),
        left() + width - 25,
        y + 4,
        { width: 25, align: 'right' }
      );
    });
    
    doc.y = chartStartY + data.length * (barHeight + 10) + 15;
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
      doc.font('Helvetica').fontSize(10).fillColor(colors.dark).text(
        `${item.label}: ${item.value} (${Math.round((item.value / total) * 100)}%)`,
        legendX + 18,
        itemY,
        { width: width - 240 }
      );
    });
    
    doc.y = legendY + data.length * 20 + 20;
  };

  const drawTable = (headers: string[], rows: string[][], columnWidths: number[]) => {
    const rowHeight = 25;
    const headerHeight = 30;
    
    ensureSpace(headerHeight + rows.length * rowHeight + 20);
    
    const startY = doc.y;
    let currentX = left();
    
    // Header
    doc.roundedRect(left(), startY, width, headerHeight, 4).fill(colors.primary);
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.white).text(
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
        doc.font('Helvetica').fontSize(10).fillColor(colors.dark).text(
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

  const drawInfoBox = (title: string, content: string, bgColor = colors.light, borderColor = colors.primary) => {
    ensureSpace(80);
    
    const boxHeight = 60 + doc.heightOfString(content, { width: width - 40 });
    
    doc.roundedRect(left(), doc.y, width, boxHeight, 8).fillAndStroke(bgColor, borderColor);
    
    const boxY = doc.y;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.primary).text(title, left() + 20, boxY + 15, { width: width - 40 });
    doc.font('Helvetica').fontSize(11).fillColor(colors.dark).text(content, left() + 20, boxY + 35, { width: width - 40, lineGap: 2 });
    
    doc.y = boxY + boxHeight + 15;
  };

  // ============ START REPORT ============

  // Cover Page
  doc.rect(0, 0, doc.page.width, 220).fill(colors.primary);
  doc.font('Helvetica-Bold').fontSize(32).fillColor(colors.white).text(
    'EXECUTIVE REPORT',
    left(),
    80,
    { width, align: 'center' }
  );
  
  doc.font('Helvetica-Bold').fontSize(24).fillColor(colors.white).text(
    'ICT Performance & Risk Overview',
    left(),
    130,
    { width, align: 'center' }
  );
  
  const reportDate = new Date(data.generatedAt);
  doc.font('Helvetica').fontSize(16).fillColor(colors.white).text(
    `Date: ${reportDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    left(),
    180,
    { width, align: 'center' }
  );

  doc.y = 250;

  // Overall Status Badge
  const overallStatus = data.headline.posture === 'stable' ? 'Stable' :
                       data.headline.posture === 'watch' ? 'Watch' :
                       'Critical';
  
  const dataConfidenceNote = data.sections.filter(s => s.dataConfidence.level === 'low').length > 0 ?
    ' (Data Confidence Limited)' : '';
  
  statusBadge(`Overall Status: ${overallStatus}${dataConfidenceNote}`, left() + (width - 200) / 2, doc.y, 200);
  doc.moveDown(3);

  // Key Metrics Cards
  heading2('Performance Overview');
  const cardWidth = (width - 30) / 4;
  const metricsY = doc.y;
  
  metricCard('ICT Score', `${data.headline.ictPerformanceScore}/100`, data.headline.posture, left(), metricsY, cardWidth);
  metricCard('Top Risks', String(data.topRisks.length), data.topRisks.length > 0 ? 'critical' : 'good', left() + cardWidth + 10, metricsY, cardWidth);
  metricCard('Watch Items', String(data.watchItems.length), data.watchItems.length > 0 ? 'warning' : 'good', left() + (cardWidth + 10) * 2, metricsY, cardWidth);
  metricCard('Actions Required', String(data.managementActionRegister.length), data.managementActionRegister.length > 5 ? 'warning' : 'good', left() + (cardWidth + 10) * 3, metricsY, cardWidth);
  
  doc.y = metricsY + 100;

  doc.addPage();

  // Executive Summary
  heading1('Executive Summary');
  paragraph(data.headline.summary);
  doc.moveDown(0.5);

  // Key Achievements
  if (data.executiveSummary.keyAchievementsThisPeriod.length > 0) {
    heading3('Key Achievements This Period');
    bulletList(data.executiveSummary.keyAchievementsThisPeriod);
  }

  // Top Risks
  if (data.executiveSummary.topRisksAndWatchItems.length > 0) {
    heading3('Top Risks & Watch Items');
    bulletList(data.executiveSummary.topRisksAndWatchItems.slice(0, 6));
  }

  // Decisions Required
  if (data.executiveSummary.majorDecisionsRequiredFromManagement.length > 0) {
    heading3('Decisions Required from Management');
    bulletList(data.executiveSummary.majorDecisionsRequiredFromManagement);
  }

  doc.addPage();

  // Performance Charts
  heading1('Performance Analysis');

  // ICT Performance Score
  const performanceData = [
    { label: 'Current Score', value: data.headline.ictPerformanceScore, color: statusColors[data.headline.posture] },
    { label: 'Target', value: 100, color: colors.grey }
  ];
  drawBarChart('ICT Performance Score', performanceData, 100);

  // Risk Distribution
  const riskData = [
    { label: 'Critical', value: data.sections.filter(s => s.boardAttentionLevel === 'critical').length, color: colors.danger },
    { label: 'High', value: data.sections.filter(s => s.boardAttentionLevel === 'high').length, color: colors.warning },
    { label: 'Medium', value: data.sections.filter(s => s.boardAttentionLevel === 'medium').length, color: colors.info },
    { label: 'Low', value: data.sections.filter(s => s.boardAttentionLevel === 'low').length, color: colors.success },
  ].filter(item => item.value > 0);

  if (riskData.length > 0) {
    drawPieChart('Risk Distribution by Priority', riskData);
  }

  doc.addPage();

  // Domain Analysis
  heading1('Domain Analysis');
  
  data.sections.forEach((section, index) => {
    if (index > 0 && index % 2 === 0) doc.addPage();
    
    heading2(`${index + 1}. ${section.title}`);
    
    // Status badge
    statusBadge(section.boardAttentionLevel.toUpperCase(), left() + width - 150, doc.y - 25);
    
    // Summary
    paragraph(section.summary);
    
    // Key Metrics
    if (section.keyMetrics.length > 0) {
      heading3('Key Metrics');
      section.keyMetrics.forEach((metric) => {
        const metricColor = statusColors[metric.status] || colors.grey;
        doc.font('Helvetica').fontSize(11).fillColor(colors.dark).text(`${metric.label}: `, left(), doc.y);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(metricColor).text(String(metric.value), left() + 100, doc.y);
        doc.moveDown(0.2);
      });
    }
    
    // Key Risks
    if (section.keyRisks.length > 0) {
      heading3('Key Risks');
      bulletList(section.keyRisks, colors.danger);
    }
    
    // Recommendations
    if (section.recommendations.length > 0) {
      heading3('Recommendations');
      bulletList(section.recommendations, colors.primary);
    }
    
    // Data Confidence
    if (section.dataConfidence.level !== 'high') {
      heading3('Data Confidence');
      paragraph(section.dataConfidence.narrative, colors.warning);
    }
    
    doc.moveDown(0.5);
  });

  doc.addPage();

  // Management Action Register
  heading1('Management Action Register');
  
  if (data.managementActionRegister.length > 0) {
    const headers = ['Issue', 'Recommended Action', 'Priority', 'Owner', 'Due Date'];
    const rows = data.managementActionRegister.slice(0, 10).map(action => [
      action.issue.substring(0, 50) + (action.issue.length > 50 ? '...' : ''),
      action.recommendedAction.substring(0, 60) + (action.recommendedAction.length > 60 ? '...' : ''),
      action.priority.toUpperCase(),
      action.owner,
      action.dueDate
    ]);
    const columnWidths = [width * 0.25, width * 0.35, width * 0.1, width * 0.15, width * 0.15];
    
    drawTable(headers, rows, columnWidths);
  } else {
    paragraph('No urgent management actions required at this time.');
  }

  doc.addPage();

  // Data Confidence Statement
  heading1('Data Confidence Statement');
  
  const lowConfidenceSections = data.sections.filter(s => s.dataConfidence.level === 'low');
  const moderateConfidenceSections = data.sections.filter(s => s.dataConfidence.level === 'moderate');
  
  if (lowConfidenceSections.length > 0 || moderateConfidenceSections.length > 0) {
    drawInfoBox(
      '⚠️ Data Quality Notice',
      `Current reporting is based on ${lowConfidenceSections.length > 0 ? 'limited and incomplete' : 'partially complete'} data sources in ${lowConfidenceSections.length + moderateConfidenceSections.length} domain(s). Zero or low values may indicate lack of visibility rather than low risk. Management will prioritize data integration and reporting completeness.`,
      '#fff3e0',
      colors.warning
    );
    
    if (lowConfidenceSections.length > 0) {
      heading3('Areas with Low Data Confidence:');
      bulletList(lowConfidenceSections.map(s => s.title));
    }
  } else {
    drawInfoBox(
      '✓ Data Quality Assurance',
      'Current reporting is based on comprehensive and reliable data sources across all domains. Metrics and insights can be used with high confidence for decision-making.',
      '#e8f5e8',
      colors.success
    );
  }

  // Way Forward
  heading1('Way Forward');
  paragraph('The focus for the next reporting cycle will be:');
  doc.moveDown(0.3);
  
  const wayForward = [
    ...data.recommendations.slice(0, 3),
    'Monitoring progress on identified management actions',
    'Improving data integration and reporting quality',
    'Strengthening governance and compliance controls'
  ];
  
  bulletList(wayForward);

  // Footer on all pages
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(9).fillColor(colors.grey).text(
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
