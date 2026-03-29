/**
 * Server-side Chart.js chart generation for the executive PDF report
 * Produces base64-encoded PNG images embedded directly into the HTML template
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const COLORS = {
  primary: '#0d2137',
  secondary: '#c9a227',
  success: '#3a7d44',
  warning: '#d4891a',
  error: '#c0392b',
  info: '#2471a3',
  muted: '#7f8c8d',
  lightGrey: '#ecf0f1',
};

async function renderChart(config: object, width = 480, height = 220): Promise<string> {
  const canvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
  const buffer = await canvas.renderToBuffer(config as any);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export async function generateScoreGaugeChart(score: number): Promise<string> {
  const remainder = 100 - score;
  const color = score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;
  return renderChart({
    type: 'doughnut',
    data: {
      datasets: [{
        data: [score, remainder],
        backgroundColor: [color, COLORS.lightGrey],
        borderWidth: 0,
        circumference: 270,
        rotation: 225,
      }],
    },
    options: {
      cutout: '78%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: false,
    },
  }, 200, 200);
}

export async function generateKpiBarChart(sections: Array<{ title: string; score: number; status: string }>): Promise<string> {
  const labels = sections.map(s => s.title.replace('Business Continuity & Disaster Recovery', 'BC & DR').replace(' Management', '').replace(' & Compliance', '').substring(0, 20));
  const bgColors = sections.map(s =>
    s.status === 'critical' || s.status === 'high' ? COLORS.error :
    s.status === 'medium' || s.status === 'warning' ? COLORS.warning :
    COLORS.success
  );

  return renderChart({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Domain Score',
        data: sections.map(s => s.score),
        backgroundColor: bgColors,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: {
          min: 0, max: 100,
          grid: { color: '#f0f0f0' },
          ticks: { font: { size: 11 } },
        },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
      animation: false,
    },
  }, 480, 220);
}

export async function generateRiskPieChart(critical: number, high: number, medium: number, low: number): Promise<string> {
  const data = [critical, high, medium, low].filter((v, i) => v > 0 || i < 2);
  const allLabels = ['Critical', 'High', 'Medium', 'Low'];
  const allColors = [COLORS.error, COLORS.warning, COLORS.info, COLORS.success];

  const filtered = allLabels.map((l, i) => ({ label: l, value: data[i] ?? 0, color: allColors[i] })).filter(d => d.value > 0);
  if (filtered.length === 0) filtered.push({ label: 'None', value: 1, color: COLORS.success });

  return renderChart({
    type: 'doughnut',
    data: {
      labels: filtered.map(d => d.label),
      datasets: [{
        data: filtered.map(d => d.value),
        backgroundColor: filtered.map(d => d.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    },
    options: {
      plugins: {
        legend: { position: 'right', labels: { font: { size: 11 }, padding: 12 } },
        tooltip: { enabled: false },
      },
      animation: false,
    },
  }, 340, 180);
}

export async function generateDomainTrendChart(domain: string, metrics: Array<{ label: string; value: number; status: string }>): Promise<string> {
  const labels = metrics.map(m => m.label.length > 16 ? m.label.substring(0, 16) + '…' : m.label);
  const values = metrics.map(m => typeof m.value === 'number' ? m.value : 0);
  const bgColors = metrics.map(m =>
    m.status === 'critical' ? COLORS.error :
    m.status === 'warning' ? COLORS.warning :
    COLORS.success
  );

  return renderChart({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: bgColors,
        borderRadius: 3,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 10 } } },
      },
      animation: false,
    },
  }, 400, 160);
}
