/**
 * Puppeteer + HTML/CSS Executive PDF Generator
 * Architecture: ICT Data → Handlebars Template → Rendered HTML → Puppeteer → PDF
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateScoreGaugeChart,
  generateKpiBarChart,
  generateRiskPieChart,
  generateDomainTrendChart,
} from './report-charts';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Handlebars = require('handlebars');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer-core');

const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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
    keyMetrics: Array<{ label: string; value: string | number; status: 'good' | 'warning' | 'critical' }>;
    keyRisks: string[];
    recommendations: string[];
    boardAttentionLevel: 'low' | 'medium' | 'high' | 'critical';
    dataConfidence: { level: 'high' | 'moderate' | 'low'; narrative: string };
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
  organizationName?: string;
  systemName?: string;
  audience?: string;
}

function ragClass(level: string): string {
  const map: Record<string, string> = {
    critical: 'red', high: 'amber', medium: 'amber', low: 'green',
    stable: 'green', watch: 'amber', good: 'green', warning: 'amber',
  };
  return map[level] ?? 'blue';
}

function attentionLabel(level: string): string {
  const map: Record<string, string> = {
    critical: 'Critical', high: 'High Risk', medium: 'Medium', low: 'Low Risk',
  };
  return map[level] ?? level.toUpperCase();
}

function priorityClass(priority: string): string {
  return priority.toLowerCase();
}

export async function generatePuppeteerPdf(data: ExecutiveData): Promise<Buffer> {
  const reportDate = new Date(data.generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const lowConfidenceDomains = data.sections.filter(s => s.dataConfidence.level === 'low');
  const lowConfidenceCount = lowConfidenceDomains.length;

  // --- Generate all charts in parallel (with graceful fallback) ---
  console.log('[PDF] Starting chart generation...');
  let scoreChart: string | null = null;
  let kpiBarChart: string | null = null;
  let riskPieChart: string | null = null;
  let domainCharts: (string | null)[] = data.sections.map(() => null);

  try {
    [scoreChart, kpiBarChart, riskPieChart] = await Promise.all([
      generateScoreGaugeChart(data.headline.ictPerformanceScore),
      generateKpiBarChart(
        data.sections.map(s => ({
          title: s.title,
          score: (() => {
            const goodCount = (s.keyMetrics || []).filter(m => m.status === 'good').length;
            const total = (s.keyMetrics || []).length || 1;
            return Math.round((goodCount / total) * 100);
          })(),
          status: s.boardAttentionLevel,
        }))
      ),
      generateRiskPieChart(
        data.sections.filter(s => s.boardAttentionLevel === 'critical').length,
        data.sections.filter(s => s.boardAttentionLevel === 'high').length,
        data.sections.filter(s => s.boardAttentionLevel === 'medium').length,
        data.sections.filter(s => s.boardAttentionLevel === 'low').length
      ),
    ]);
    console.log('[PDF] Summary charts generated OK');

    domainCharts = await Promise.all(
      data.sections.map(section =>
        (section.keyMetrics && section.keyMetrics.length > 0)
          ? generateDomainTrendChart(section.title, section.keyMetrics.map(m => ({
              label: m.label,
              value: typeof m.value === 'string' ? parseFloat(m.value) || 0 : m.value,
              status: m.status,
            })))
          : Promise.resolve(null)
      )
    );
    console.log('[PDF] Domain charts generated OK');
  } catch (chartErr: any) {
    console.error('[PDF] Chart generation failed (continuing without charts):', chartErr?.message);
  }

  const organizationName = data.organizationName || 'Institution';
  const systemName = data.systemName || 'I-ICTMS';
  const audience = data.audience || 'EXCO / Board';

  // --- Build template data ---
  const templateData = {
    reportDate,
    organizationName,
    systemName,
    reportTitle: 'ICT Executive Report',
    audience,
    confidentialityLabel: `CONFIDENTIAL — For ${audience} Use Only`,
    ictScore: data.headline.ictPerformanceScore,
    posture: data.headline.posture,
    postureLabel: data.headline.posture.charAt(0).toUpperCase() + data.headline.posture.slice(1),
    headlineSummary: data.headline.summary,
    overallPosture: data.executiveSummary.overallInstitutionalIctPosture,
    topRisksCount: data.topRisks.length,
    watchCount: data.watchItems.length,
    actionsCount: data.managementActionRegister.length,
    lowConfidenceCount,
    topRisksColor: data.topRisks.length > 0 ? 'red' : 'green',
    watchColor: data.watchItems.length > 0 ? 'amber' : 'green',
    actionsColor: data.managementActionRegister.length > 5 ? 'amber' : 'green',
    domainsColor: lowConfidenceCount > 0 ? 'amber' : 'green',
    scoreChart,
    kpiBarChart,
    riskPieChart,
    achievements: data.executiveSummary.keyAchievementsThisPeriod.slice(0, 5),
    topRisksAndWatch: data.executiveSummary.topRisksAndWatchItems.slice(0, 6),
    decisionsRequired: data.executiveSummary.majorDecisionsRequiredFromManagement,
    sections: data.sections.map((section, i) => ({
      ...section,
      sectionIndex: i + 1,
      boardAttentionLevelLabel: attentionLabel(section.boardAttentionLevel),
      hasDataWarning: section.dataConfidence.level !== 'high',
      dataConfidenceClass: section.dataConfidence.level === 'low' ? 'dq-banner-low' : '',
      keyRisks: (section.keyRisks || []).slice(0, 4),
      recommendations: (section.recommendations || []).slice(0, 4),
      domainChart: domainCharts[i],
    })),
    managementActions: data.managementActionRegister.slice(0, 12).map(action => ({
      ...action,
      priorityClass: priorityClass(action.priority),
      priority: action.priority.toUpperCase(),
      businessImpact: (action.businessImpact || '').substring(0, 80) + ((action.businessImpact || '').length > 80 ? '…' : ''),
      recommendedAction: (action.recommendedAction || '').substring(0, 100) + ((action.recommendedAction || '').length > 100 ? '…' : ''),
    })),
    hasLowConfidence: lowConfidenceCount > 0,
    lowConfidenceDomains: lowConfidenceDomains.map(s => `${s.title} — ${s.dataConfidence.narrative}`),
    wayForward: [
      ...data.recommendations.slice(0, 3),
      'Monitor progress on all outstanding management actions',
      'Improve data integration and reporting quality across low-confidence domains',
      'Strengthen governance, compliance, and cybersecurity controls',
    ],
  };

  // --- Compile Handlebars template ---
  // Resolve template from multiple candidate paths (dev vs prod build structures differ)
  const candidatePaths = [
    path.join(__dirname, 'report-template.hbs'),
    path.join(__dirname, '../../dashboards/report-template.hbs'),
    path.join(process.cwd(), 'src/dashboards/report-template.hbs'),
    path.join(process.cwd(), 'dist/dashboards/report-template.hbs'),
    path.join(process.cwd(), 'dist/src/dashboards/report-template.hbs'),
  ];
  const templatePath = candidatePaths.find(p => fs.existsSync(p));
  if (!templatePath) {
    throw new Error(`report-template.hbs not found. Tried:\n${candidatePaths.join('\n')}`);
  }
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  console.log('[PDF] Template found at:', templatePath);
  const template = Handlebars.compile(templateSource);
  const html = template(templateData);
  console.log('[PDF] Template compiled, HTML length:', html.length);

  // --- Launch Puppeteer and render to PDF ---
  const chromePath = CHROME_PATH;
  console.log('[PDF] Launching Puppeteer with Chrome at:', chromePath);

  // Verify Chrome exists before launching
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found at: ${chromePath}. Set CHROME_PATH env var to override.`);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'shell',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
    timeout: 60000,
  });

  console.log('[PDF] Browser launched, opening page...');

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('[PDF] HTML loaded, generating PDF...');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      timeout: 60000,
    });

    console.log('[PDF] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
    console.log('[PDF] Browser closed');
  }
}
