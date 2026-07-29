// AutoFill Pro — HTML Dashboard Module
// Self-contained HTML with inline SVG charts

const Dashboard = {
  // Color palette
  colors: {
    active: '#3b82f6',
    interview: '#f59e0b',
    offer: '#8b5cf6',
    hired: '#22c55e',
    rejected: '#ef4444',
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
  },

  // Status normalization
  normalizeStatus(status) {
    const map = {
      applied: 'Active',
      active: 'Active',
      interview: 'Interview',
      offer: 'Offer',
      hired: 'Hired',
      rejected: 'Rejected/Closed',
      no_response: 'Rejected/Closed',
      offer_declined: 'Rejected/Closed',
      withdrawn: 'Rejected/Closed',
    };
    return map[status.toLowerCase()] || 'Active';
  },

  // Compute statistics
  computeStats(applications) {
    const stats = {
      total: applications.length,
      byStatus: {},
      bySector: {},
      byChannel: {},
      funnel: {
        applied: 0,
        interview: 0,
        offer: 0,
        hired: 0,
      },
    };

    for (const app of applications) {
      const status = this.normalizeStatus(app.status);
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      const sector = app.sector || 'Unknown';
      stats.bySector[sector] = (stats.bySector[sector] || 0) + 1;

      const channel = app.channel || 'Online';
      stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;

      // Funnel
      if (status === 'Active') stats.funnel.applied++;
      if (status === 'Interview') stats.funnel.interview++;
      if (status === 'Offer') stats.funnel.offer++;
      if (status === 'Hired') stats.funnel.hired++;
    }

    return stats;
  },

  // Generate doughnut SVG
  generateDoughnutSVG(stats) {
    const data = Object.entries(stats.byStatus);
    const total = data.reduce((sum, [, count]) => sum + count, 0);
    let currentAngle = 0;

    const radius = 80;
    const cx = 100;
    const cy = 100;
    const innerRadius = 50;

    const paths = data.map(([status, count]) => {
      const angle = (count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const color = this.colors[status.toLowerCase().replace('/', '')] || '#6b7280';

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const ix1 = cx + innerRadius * Math.cos(startRad);
      const iy1 = cy + innerRadius * Math.sin(startRad);
      const ix2 = cx + innerRadius * Math.cos(endRad);
      const iy2 = cy + innerRadius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      return `<path d="M ${ix1} ${iy1} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z" fill="${color}" />`;
    });

    return `<svg width="200" height="200" viewBox="0 0 200 200">${paths.join('')}</svg>`;
  },

  // Generate bar SVG
  generateBarSVG(data, width = 300, height = 150) {
    const entries = Object.entries(data);
    const maxCount = Math.max(...entries.map(([, count]) => count));
    const barHeight = 20;
    const gap = 10;

    const bars = entries.map(([label, count], i) => {
      const y = i * (barHeight + gap);
      const barWidth = (count / maxCount) * (width - 100);

      return `
        <rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" fill="${this.colors.active}" rx="4" />
        <text x="75" y="${y + 14}" text-anchor="end" font-size="12" fill="${this.colors.text}">${label}</text>
        <text x="${85 + barWidth}" y="${y + 14}" font-size="12" fill="${this.colors.text}">${count}</text>
      `;
    });

    return `<svg width="${width}" height="${entries.length * (barHeight + gap)}" viewBox="0 0 ${width} ${entries.length * (barHeight + gap)}">${bars.join('')}</svg>`;
  },

  // Generate funnel SVG
  generateFunnelSVG(funnel) {
    const stages = [
      { label: 'Applied', count: funnel.applied, color: this.colors.active },
      { label: 'Interview', count: funnel.interview, color: this.colors.interview },
      { label: 'Offer', count: funnel.offer, color: this.colors.offer },
      { label: 'Hired', count: funnel.hired, color: this.colors.hired },
    ];

    const width = 300;
    const stageHeight = 40;
    const maxWidth = 250;

    const rects = stages.map((stage, i) => {
      const y = i * (stageHeight + 10);
      const barWidth = (stage.count / stages[0].count) * maxWidth;
      const x = (width - barWidth) / 2;

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${stageHeight}" fill="${stage.color}" rx="8" />
        <text x="${width / 2}" y="${y + 24}" text-anchor="middle" font-size="14" fill="white" font-weight="bold">${stage.label}: ${stage.count}</text>
      `;
    });

    return `<svg width="${width}" height="${stages.length * (stageHeight + 10)}" viewBox="0 0 ${width} ${stages.length * (stageHeight + 10)}">${rects.join('')}</svg>`;
  },

  // Generate full HTML dashboard
  generateHTML(applications) {
    const stats = this.computeStats(applications);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutoFill Pro — Application Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; color: #1f2937; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat { background: white; padding: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 32px; font-weight: bold; }
    .stat-label { font-size: 14px; color: #6b7280; }
    .charts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 24px; }
    .chart { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart h3 { margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-active { background: #dbeafe; color: #1d4ed8; }
    .status-interview { background: #fef3c7; color: #d97706; }
    .status-offer { background: #ede9fe; color: #7c3aed; }
    .status-hired { background: #dcfce7; color: #16a34a; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 AutoFill Pro — Application Dashboard</h1>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.funnel.interview}</div>
        <div class="stat-label">Interviews</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.funnel.offer}</div>
        <div class="stat-label">Offers</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.funnel.hired}</div>
        <div class="stat-label">Hired</div>
      </div>
    </div>

    <div class="charts">
      <div class="chart">
        <h3>Status Distribution</h3>
        ${this.generateDoughnutSVG(stats)}
      </div>
      <div class="chart">
        <h3>By Sector</h3>
        ${this.generateBarSVG(stats.bySector)}
      </div>
      <div class="chart">
        <h3>By Channel</h3>
        ${this.generateBarSVG(stats.byChannel)}
      </div>
      <div class="chart">
        <h3>Application Funnel</h3>
        ${this.generateFunnelSVG(stats.funnel)}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Company</th>
          <th>Role</th>
          <th>Sector</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${applications.map(app => `
          <tr>
            <td>${this.escapeHTML(app.company)}</td>
            <td>${this.escapeHTML(app.role)}</td>
            <td>${this.escapeHTML(app.sector || '-')}</td>
            <td><span class="status status-${this.normalizeStatus(app.status).toLowerCase().replace('/', '-')}">${this.normalizeStatus(app.status)}</span></td>
            <td>${app.date || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  },

  // HTML escape
  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  },
};

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { Dashboard };
}
