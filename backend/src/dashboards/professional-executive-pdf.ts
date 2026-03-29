/**
 * Professional Executive PDF Report Generator
 * Matches the uploaded design with clean sections, proper headers, and professional layout
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

export async function generateProfessionalExecutivePdf(data: ExecutiveData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = () => doc.page.margins.left;
  const right = () => doc.page.width - doc.page.margins.right;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  // Professional color palette matching the uploaded design
  const colors = {
    primary: '#1a365d',      // Deep blue header
    secondary: '#2c5282',    // Medium blue
    accent: '#3182ce',      // Light blue accent
    success: '#38a169',     // Green
    warning: '#d69e2e',     // Amber/yellow
    error: '#e53e3e',       // Red
    info: '#3182ce',        // Info blue
    light: '#f7fafc',       // Light background
    border: '#e2e8f0',      // Light border
    text: '#2d3748',        // Dark text
    muted: '#718096',       // Muted text
    white: '#ffffff',       // White
  };

  const statusColors = {
    good: colors.success,
    warning: colors.warning,
    critical: colors.error,
    stable: colors.success,
    watch: colors.warning,
    high: colors.error,
    medium: colors.warning,
    low: colors.info,
  };

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const ensureSpace = (height: number) => {
    if (doc.y + height > bottom()) doc.addPage();
  };

  const sectionHeader = (title: string, subtitle?: string) => {
    ensureSpace(60);
    
    // Header background
    doc.rect(left(), doc.y, width, 40).fill(colors.primary);
    
    // Title
    doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.white).text(title, left() + 20, doc.y + 12);
    
    // Subtitle if provided
    if (subtitle) {
      doc.font('Helvetica').fontSize(11).fillColor(colors.white).text(subtitle, left() + 20, doc.y + 25);
    }
    
    doc.y = doc.y + 50;
  };

  const heading1 = (text: string) => {
    ensureSpace(40);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.primary).text(text, left(), doc.y);
    doc.moveDown(0.5);
  };

  const heading2 = (text: string) => {
    ensureSpace(30);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.text).text(text, left(), doc.y);
    doc.moveDown(0.3);
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
    const badgeColor = statusColors[status as keyof typeof statusColors] || colors.muted;
    const badgeWidth = 80;
    const badgeHeight = 20;
    
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 3).fill(badgeColor);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text(
      status.toUpperCase(),
      x,
      y + 5,
      { width: badgeWidth, align: 'center' }
    );
  };

  const metricBox = (title: string, value: string, status: string, x: number, y: number, boxWidth: number) => {
    const boxHeight = 60;
    const statusColor = statusColors[status as keyof typeof statusColors] || colors.muted;
    
    // Box background
    doc.roundedRect(x, y, boxWidth, boxHeight, 4).fillAndStroke(colors.white, colors.border);
    
    // Top border
    doc.rect(x, y, boxWidth, 3).fill(statusColor);
    
    // Content
    doc.font('Helvetica').fontSize(10).fillColor(colors.muted).text(title, x + 10, y + 12, { width: boxWidth - 20 });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.text).text(value, x + 10, y + 30, { width: boxWidth - 20 });
  };

  const infoBox = (title: string, content: string, bgColor = colors.light, borderColor = colors.primary) => {
    ensureSpace(70);
    
    const boxHeight = 50 + doc.heightOfString(content, { width: width - 40 });
    
    doc.roundedRect(left(), doc.y, width, boxHeight, 6).fillAndStroke(bgColor, borderColor);
    
    const boxY = doc.y;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.primary).text(title, left() + 20, boxY + 15, { width: width - 40 });
    doc.font('Helvetica').fontSize(11).fillColor(colors.text).text(content, left() + 20, boxY + 35, { width: width - 40, lineGap: 2 });
    
    doc.y = boxY + boxHeight + 15;
  };

  const cleanTable = (headers: string[], rows: string[][], columnWidths: number[]) => {
    const rowHeight = 20;
    const headerHeight = 25;
    
    ensureSpace(headerHeight + rows.length * rowHeight + 20);
    
    const startY = doc.y;
    let currentX = left();
    
    // Header
    doc.rect(left(), startY, width, headerHeight).fill(colors.primary);
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(
        header,
        currentX + 8,
        startY + 6,
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
          currentY + 4,
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
  doc.rect(0, 0, doc.page.width, 200).fill(colors.primary);
  
  // Main title
  doc.font('Helvetica-Bold').fontSize(32).fillColor(colors.white).text(
    'EXECUTIVE REPORT',
    left(),
    80,
    { width, align: 'center' }
  );
  
  doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.white).text(
    'ICT Performance & Risk Overview',
    left(),
    120,
    { width, align: 'center' }
  );
  
  const reportDate = new Date(data.generatedAt);
  doc.font('Helvetica').fontSize(14).fillColor(colors.white).text(
    `Date: ${reportDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    left(),
    160,
    { width, align: 'center' }
  );

  doc.y = 230;

  // Executive Summary Section
  sectionHeader('Executive Summary', 'Overall ICT Performance and Risk Assessment');
  
  // Status badge
  const overallStatus = data.headline.posture === 'stable' ? 'Stable' :
                       data.headline.posture === 'watch' ? 'Watch' :
                       'Critical';
  statusBadge(overallStatus, right() - 100, doc.y - 35);
  
  paragraph(data.headline.summary);

  // Key Metrics Overview
  heading2('Key Performance Indicators');
  const boxWidth = (width - 15) / 4;
  const metricsY = doc.y;
  
  metricBox('ICT Score', `${data.headline.ictPerformanceScore}/100`, data.headline.posture, left(), metricsY, boxWidth);
  metricBox('Top Risks', String(data.topRisks.length), data.topRisks.length > 0 ? 'critical' : 'good', left() + boxWidth + 5, metricsY, boxWidth);
  metricBox('Watch Items', String(data.watchItems.length), data.watchItems.length > 0 ? 'warning' : 'good', left() + (boxWidth + 5) * 2, metricsY, boxWidth);
  metricBox('Actions', String(data.managementActionRegister.length), data.managementActionRegister.length > 5 ? 'warning' : 'good', left() + (boxWidth + 5) * 3, metricsY, boxWidth);
  
  doc.y = metricsY + 80;

  doc.addPage();

  // Key Achievements
  if (data.executiveSummary.keyAchievementsThisPeriod.length > 0) {
    sectionHeader('Key Achievements', 'Accomplishments This Period');
    bulletList(data.executiveSummary.keyAchievementsThisPeriod);
  }

  // Top Risks
  if (data.executiveSummary.topRisksAndWatchItems.length > 0) {
    sectionHeader('Top Risks & Watch Items', 'Critical Issues Requiring Attention');
    bulletList(data.executiveSummary.topRisksAndWatchItems.slice(0, 8));
  }

  // Decisions Required
  if (data.executiveSummary.majorDecisionsRequiredFromManagement.length > 0) {
    sectionHeader('Decisions Required', 'Management Action Items');
    bulletList(data.executiveSummary.majorDecisionsRequiredFromManagement);
  }

  doc.addPage();

  // Domain Analysis
  sectionHeader('Domain Analysis', 'Detailed Assessment by ICT Domain');
  
  data.sections.forEach((section, index) => {
    if (index > 0) {
      ensureSpace(30);
      doc.moveTo(left(), doc.y).lineTo(left() + width, doc.y).strokeColor(colors.border).stroke();
      doc.moveDown(0.5);
    }
    
    heading2(`${index + 1}. ${section.title}`);
    
    // Status badge
    statusBadge(section.boardAttentionLevel.toUpperCase(), right() - 100, doc.y - 25);
    
    // Summary
    paragraph(section.summary);
    
    // Key Metrics
    if (section.keyMetrics && section.keyMetrics.length > 0) {
      heading2('Key Metrics');
      section.keyMetrics.forEach((metric) => {
        const metricColor = statusColors[metric.status] || colors.text;
        doc.font('Helvetica').fontSize(11).fillColor(colors.text).text(`${metric.label}: `, left(), doc.y);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(metricColor).text(String(metric.value), left() + 120, doc.y);
        doc.moveDown(0.2);
      });
    }
    
    // Key Risks
    if (section.keyRisks && section.keyRisks.length > 0) {
      heading2('Key Risks');
      bulletList(section.keyRisks.slice(0, 4), colors.error);
    }
    
    // Recommendations
    if (section.recommendations && section.recommendations.length > 0) {
      heading2('Recommendations');
      bulletList(section.recommendations.slice(0, 4), colors.primary);
    }
    
    // Data Confidence
    if (section.dataConfidence.level !== 'high') {
      heading2('Data Confidence');
      paragraph(section.dataConfidence.narrative, colors.warning);
    }
    
    doc.moveDown(0.5);
  });

  doc.addPage();

  // Management Action Register
  sectionHeader('Management Action Register', 'Priority Action Items');
  
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
  sectionHeader('Data Quality Statement', 'Assessment of Data Reliability');
  
  const lowConfidenceSections = data.sections.filter(s => s.dataConfidence.level === 'low');
  const moderateConfidenceSections = data.sections.filter(s => s.dataConfidence.level === 'moderate');
  
  if (lowConfidenceSections.length > 0 || moderateConfidenceSections.length > 0) {
    infoBox(
      '⚠️ Data Quality Notice',
      `Current reporting is based on ${lowConfidenceSections.length > 0 ? 'limited and incomplete' : 'partially complete'} data sources in ${lowConfidenceSections.length + moderateConfidenceSections.length} domain(s). Zero or low values may indicate lack of visibility rather than low risk.`,
      '#fff7ed',
      colors.warning
    );
    
    if (lowConfidenceSections.length > 0) {
      heading2('Areas with Low Data Confidence');
      bulletList(lowConfidenceSections.map(s => s.title));
    }
  } else {
    infoBox(
      '✓ Data Quality Assurance',
      'Current reporting is based on comprehensive and reliable data sources across all domains. Metrics and insights can be used with high confidence for decision-making.',
      '#f0fdf4',
      colors.success
    );
  }

  // Way Forward
  sectionHeader('Way Forward', 'Focus Areas for Next Period');
  paragraph('The focus for the next reporting cycle will be:');
  doc.moveDown(0.3);
  
  const wayForward = [
    ...data.recommendations.slice(0, 3),
    'Monitor progress on identified management actions',
    'Improve data integration and reporting quality',
    'Strengthen governance and compliance controls'
  ];
  
  bulletList(wayForward);

  // Footer on all pages
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
