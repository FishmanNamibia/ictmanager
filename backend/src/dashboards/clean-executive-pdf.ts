/**
 * Clean, Professional Executive PDF Report Generator
 * Modern, minimalist design with clean typography and professional layout
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

export async function generateCleanExecutivePdf(data: ExecutiveData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 60, bufferPages: true });
  const chunks: Buffer[] = [];
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = () => doc.page.margins.left;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  // Professional color palette - clean and subtle
  const colors = {
    primary: '#0d2137',
    secondary: '#c9a227',
    accent: '#2c5282',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    grey: '#64748b',
    light: '#f8fafc',
    border: '#e2e8f0',
    text: '#1e293b',
    muted: '#64748b',
  };

  const statusColors = {
    good: colors.success,
    warning: colors.warning,
    critical: colors.error,
    stable: colors.success,
    watch: colors.warning,
    high: colors.error,
    medium: colors.warning,
    low: colors.accent,
  };

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const ensureSpace = (height: number) => {
    if (doc.y + height > bottom()) doc.addPage();
  };

  const heading1 = (text: string) => {
    ensureSpace(50);
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(24).fillColor(colors.primary).text(text, left(), doc.y);
    doc.moveDown(0.5);
  };

  const heading2 = (text: string) => {
    ensureSpace(35);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.text).text(text, left(), doc.y);
    doc.moveDown(0.3);
  };

  const heading3 = (text: string) => {
    ensureSpace(30);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.text).text(text, left(), doc.y);
    doc.moveDown(0.2);
  };

  const paragraph = (text: string, color = colors.text) => {
    ensureSpace(25);
    doc.font('Helvetica').fontSize(11).fillColor(color).text(text, left(), doc.y, { width, lineGap: 3 });
    doc.moveDown(0.4);
  };

  const bulletList = (items: string[], color = colors.text) => {
    items.forEach(item => {
      ensureSpace(20);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary).text('•', left(), y);
      doc.font('Helvetica').fontSize(11).fillColor(color).text(item, left() + 15, y, { width: width - 15, lineGap: 2 });
      doc.moveDown(0.3);
    });
  };

  const statusBadge = (status: string, x: number, y: number) => {
    const badgeColor = statusColors[status as keyof typeof statusColors] || colors.grey;
    const badgeWidth = 120;
    const badgeHeight = 24;
    
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 4).fill(badgeColor);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(
      status.toUpperCase(),
      x,
      y + 7,
      { width: badgeWidth, align: 'center' }
    );
  };

  const metricCard = (title: string, value: string, status: string, x: number, y: number, cardWidth: number) => {
    const cardHeight = 70;
    const statusColor = statusColors[status as keyof typeof statusColors] || colors.grey;
    
    // Card background
    doc.roundedRect(x, y, cardWidth, cardHeight, 6).fillAndStroke(colors.light, colors.border);
    
    // Status indicator line
    doc.rect(x, y, cardWidth, 3).fill(statusColor);
    
    // Content
    doc.font('Helvetica').fontSize(10).fillColor(colors.muted).text(title, x + 12, y + 15, { width: cardWidth - 24 });
    doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.text).text(value, x + 12, y + 35, { width: cardWidth - 24 });
  };

  const divider = () => {
    ensureSpace(20);
    const y = doc.y;
    doc.moveTo(left(), y).lineTo(left() + width, y).strokeColor(colors.border).stroke();
    doc.moveDown(0.5);
  };

  const cleanTable = (headers: string[], rows: string[][], columnWidths: number[]) => {
    const rowHeight = 22;
    const headerHeight = 28;
    
    ensureSpace(headerHeight + rows.length * rowHeight + 20);
    
    const startY = doc.y;
    let currentX = left();
    
    // Header
    doc.rect(left(), startY, width, headerHeight).fill(colors.primary);
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(
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
      const fillColor = rowIndex % 2 === 0 ? colors.light : '#ffffff';
      doc.rect(left(), currentY, width, rowHeight).fill(fillColor);
      
      row.forEach((cell, cellIndex) => {
        doc.font('Helvetica').fontSize(9).fillColor(colors.text).text(
          cell,
          currentX + 8,
          currentY + 5,
          { width: columnWidths[cellIndex] - 16, align: 'left' }
        );
        currentX += columnWidths[cellIndex];
      });
      
      currentY += rowHeight;
    });
    
    doc.y = currentY + 10;
  };

  // ============ START REPORT ============

  // Cover Page
  doc.rect(0, 0, doc.page.width, 180).fill(colors.primary);
  
  // Title
  doc.font('Helvetica-Bold').fontSize(36).fillColor('#ffffff').text(
    'Executive Report',
    left(),
    80,
    { width, align: 'center' }
  );
  
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff').text(
    'ICT Performance & Risk Overview',
    left(),
    130,
    { width, align: 'center' }
  );
  
  const reportDate = new Date(data.generatedAt);
  doc.font('Helvetica').fontSize(14).fillColor('#ffffff').text(
    `Date: ${reportDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    left(),
    160,
    { width, align: 'center' }
  );

  doc.y = 220;

  // Executive Summary Box
  doc.roundedRect(left(), doc.y, width, 100, 8).fillAndStroke(colors.light, colors.border);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.primary).text('Executive Summary', left() + 20, doc.y + 20);
  doc.font('Helvetica').fontSize(11).fillColor(colors.text).text(data.headline.summary, left() + 20, doc.y + 40, { width: width - 40, lineGap: 3 });
  
  // Status Badge
  const overallStatus = data.headline.posture === 'stable' ? 'Stable' :
                       data.headline.posture === 'watch' ? 'Watch' :
                       'Critical';
  statusBadge(overallStatus, left() + width - 140, doc.y + 20);

  doc.y = 340;

  // Key Metrics
  heading2('Key Performance Indicators');
  const cardWidth = (width - 20) / 4;
  const metricsY = doc.y;
  
  metricCard('ICT Score', `${data.headline.ictPerformanceScore}/100`, data.headline.posture, left(), metricsY, cardWidth);
  metricCard('Top Risks', String(data.topRisks.length), data.topRisks.length > 0 ? 'critical' : 'good', left() + cardWidth + 5, metricsY, cardWidth);
  metricCard('Watch Items', String(data.watchItems.length), data.watchItems.length > 0 ? 'warning' : 'good', left() + (cardWidth + 5) * 2, metricsY, cardWidth);
  metricCard('Actions', String(data.managementActionRegister.length), data.managementActionRegister.length > 5 ? 'warning' : 'good', left() + (cardWidth + 5) * 3, metricsY, cardWidth);
  
  doc.y = metricsY + 90;

  doc.addPage();

  // Overall Assessment
  heading1('Overall Assessment');
  paragraph(data.executiveSummary.overallInstitutionalIctPosture);

  // Key Achievements
  if (data.executiveSummary.keyAchievementsThisPeriod.length > 0) {
    heading2('Key Achievements');
    bulletList(data.executiveSummary.keyAchievementsThisPeriod);
  }

  // Top Risks
  if (data.executiveSummary.topRisksAndWatchItems.length > 0) {
    heading2('Top Risks & Watch Items');
    bulletList(data.executiveSummary.topRisksAndWatchItems.slice(0, 8));
  }

  // Decisions Required
  if (data.executiveSummary.majorDecisionsRequiredFromManagement.length > 0) {
    heading2('Decisions Required from Management');
    bulletList(data.executiveSummary.majorDecisionsRequiredFromManagement);
  }

  doc.addPage();

  // Domain Analysis
  heading1('Domain Analysis');
  
  data.sections.forEach((section, index) => {
    if (index > 0) divider();
    
    heading2(`${index + 1}. ${section.title}`);
    
    // Status badge
    statusBadge(section.boardAttentionLevel.toUpperCase(), left() + width - 120, doc.y - 25);
    
    // Summary
    paragraph(section.summary);
    
    // Key Metrics
    if (section.keyMetrics && section.keyMetrics.length > 0) {
      heading3('Key Metrics');
      section.keyMetrics.forEach((metric) => {
        const metricColor = statusColors[metric.status] || colors.text;
        doc.font('Helvetica').fontSize(11).fillColor(colors.text).text(`${metric.label}: `, left(), doc.y);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(metricColor).text(String(metric.value), left() + 120, doc.y);
        doc.moveDown(0.2);
      });
    }
    
    // Key Risks
    if (section.keyRisks && section.keyRisks.length > 0) {
      heading3('Key Risks');
      bulletList(section.keyRisks.slice(0, 4), colors.error);
    }
    
    // Recommendations
    if (section.recommendations && section.recommendations.length > 0) {
      heading3('Recommendations');
      bulletList(section.recommendations.slice(0, 4), colors.primary);
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
      action.issue.substring(0, 45) + (action.issue.length > 45 ? '...' : ''),
      action.recommendedAction.substring(0, 55) + (action.recommendedAction.length > 55 ? '...' : ''),
      action.priority.toUpperCase(),
      action.owner,
      action.dueDate
    ]);
    const columnWidths = [width * 0.25, width * 0.35, width * 0.1, width * 0.15, width * 0.15];
    
    cleanTable(headers, rows, columnWidths);
  } else {
    paragraph('No urgent management actions required at this time.');
  }

  doc.addPage();

  // Data Quality Statement
  heading1('Data Quality Statement');
  
  const lowConfidenceSections = data.sections.filter(s => s.dataConfidence.level === 'low');
  const moderateConfidenceSections = data.sections.filter(s => s.dataConfidence.level === 'moderate');
  
  if (lowConfidenceSections.length > 0 || moderateConfidenceSections.length > 0) {
    doc.roundedRect(left(), doc.y, width, 80, 6).fillAndStroke('#fff7ed', colors.warning);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.warning).text('⚠️ Data Quality Notice', left() + 20, doc.y + 20);
    doc.font('Helvetica').fontSize(11).fillColor(colors.text).text(
      `Current reporting is based on ${lowConfidenceSections.length > 0 ? 'limited and incomplete' : 'partially complete'} data sources in ${lowConfidenceSections.length + moderateConfidenceSections.length} domain(s). Zero or low values may indicate lack of visibility rather than low risk.`,
      left() + 20,
      doc.y + 40,
      { width: width - 40, lineGap: 2 }
    );
    
    if (lowConfidenceSections.length > 0) {
      doc.y = doc.y + 90;
      heading3('Areas with Low Data Confidence:');
      bulletList(lowConfidenceSections.map(s => s.title));
    }
  } else {
    doc.roundedRect(left(), doc.y, width, 60, 6).fillAndStroke('#f0fdf4', colors.success);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.success).text('✓ Data Quality Assurance', left() + 20, doc.y + 20);
    doc.font('Helvetica').fontSize(11).fillColor(colors.text).text(
      'Current reporting is based on comprehensive and reliable data sources across all domains.',
      left() + 20,
      doc.y + 40,
      { width: width - 40, lineGap: 2 }
    );
  }

  // Way Forward
  doc.y = doc.y + 80;
  heading1('Way Forward');
  paragraph('The focus for the next reporting cycle will be:');
  doc.moveDown(0.3);
  
  const wayForward = [
    ...data.recommendations.slice(0, 3),
    'Monitor progress on identified management actions',
    'Improve data integration and reporting quality',
    'Strengthen governance and compliance controls'
  ];
  
  bulletList(wayForward);

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(9).fillColor(colors.muted).text(
      `ICT Executive Report | Page ${i + 1} of ${range.count} | ${reportDate.toLocaleDateString('en-GB')}`,
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
