// js/components/dashboard.js
import db from '../db.js';

export default {
  render(container) {
    const data = db.getData();
    const report = db.getDailyReportDetails();
    
    // Calculate simple stats
    const totalTables = data.tables.length;
    const occupiedTables = data.tables.filter(t => t.status === 'occupied' || t.status === 'bill_requested').length;
    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;
    
    const activeKOTCount = data.kots.filter(k => k.status === 'preparing' || k.status === 'ready').length;
    const activeAggCount = data.aggregators.filter(a => a.status === 'incoming' || a.status === 'preparing').length;

    // Build category list html
    const categoriesHtml = Object.entries(report.categoryPopularity).length > 0 
      ? Object.entries(report.categoryPopularity).map(([cat, count]) => `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
              <span>${cat}</span>
              <span style="font-weight: bold;">${count} items</span>
            </div>
            <div style="background: var(--bg-primary); height: 6px; border-radius: 3px; overflow: hidden;">
              <div style="background: var(--accent-color); width: ${Math.min(count * 10, 100)}%; height: 100%;"></div>
            </div>
          </div>
        `).join('')
      : `<p style="font-size: 13px; color: var(--text-muted);">No sales data today yet.</p>`;

    // Popular items
    const popularItemsHtml = report.popularItems.length > 0
      ? report.popularItems.map(([name, qty]) => `
          <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: var(--bg-primary); border-radius: var(--radius-sm); font-size: 13px;">
            <span>${name}</span>
            <strong style="color: var(--accent-color)">x${qty}</strong>
          </div>
        `).join('')
      : `<p style="font-size: 13px; color: var(--text-muted);">No items sold today yet.</p>`;

    // Warning / alerts
    const warnings = [];
    data.tables.forEach(t => {
      if (t.status === 'occupied' && t.seatedTime) {
        const elapsedMin = Math.round((Date.now() - new Date(t.seatedTime).getTime()) / 60000);
        if (elapsedMin > 75) {
          warnings.push({ type: 'warning', text: `Table ${t.number} has been occupied for over ${elapsedMin} minutes.` });
        }
      }
      if (t.waiterCalled) {
        warnings.push({ type: 'danger', text: `Table ${t.number} is requesting waiter: "${t.waiterCallMessage || 'Assistance'}"` });
      }
    });

    data.kots.forEach(k => {
      if (k.status === 'preparing') {
        const elapsedMin = Math.round((Date.now() - new Date(k.createdAt).getTime()) / 60000);
        if (elapsedMin > 20) {
          warnings.push({ type: 'danger', text: `KOT #${k.kotNumber} (Table ${k.tableNumber}) is taking long (${elapsedMin} mins).` });
        }
      }
    });

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">Live Kitchen & Floor Dashboard</h1>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="refresh-dashboard">🔄 Refresh</button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="dashboard-metrics-grid">
        <div class="card metric-card">
          <div class="metric-header">
            <span class="metric-title">Gross Sales (Today)</span>
            <span class="metric-icon">💰</span>
          </div>
          <div class="metric-value">$${report.totalSales.toFixed(2)}</div>
          <div class="metric-trend trend-up">
            <span>Sales from ${report.salesCount} invoices</span>
          </div>
        </div>

        <div class="card metric-card">
          <div class="metric-header">
            <span class="metric-title">Table Occupancy</span>
            <span class="metric-icon">🍽️</span>
          </div>
          <div class="metric-value">${occupancyRate}%</div>
          <div class="metric-trend">
            <span style="color: var(--text-secondary);">${occupiedTables} of ${totalTables} tables occupied</span>
          </div>
        </div>

        <div class="card metric-card">
          <div class="metric-header">
            <span class="metric-title">Active Kitchen Tickets</span>
            <span class="metric-icon">🔥</span>
          </div>
          <div class="metric-value">${activeKOTCount}</div>
          <div class="metric-trend ${activeKOTCount > 5 ? 'trend-down' : 'trend-up'}">
            <span>KOT queue status: ${activeKOTCount > 5 ? 'Busy' : 'Normal'}</span>
          </div>
        </div>

        <div class="card metric-card">
          <div class="metric-header">
            <span class="metric-title">Online Delivery</span>
            <span class="metric-icon">🛵</span>
          </div>
          <div class="metric-value">${activeAggCount}</div>
          <div class="metric-trend trend-up">
            <span>Active Swiggy/Zomato orders</span>
          </div>
        </div>
      </div>

      <!-- System warnings/Alerts -->
      ${warnings.length > 0 ? `
        <div class="card" style="border-left: 4px solid var(--danger-color); padding: 15px 20px;">
          <h3 style="margin-bottom: 12px; color: var(--danger-color); display: flex; align-items: center; gap: 8px;">
            ⚠️ Attention Required (${warnings.length} Alerts)
          </h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${warnings.map(w => `
              <div style="font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: ${w.type === 'danger' ? 'var(--danger-color)' : 'var(--warning-color)'}; color: white; padding: 2px 6px;">
                  ${w.type.toUpperCase()}
                </span>
                <span>${w.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Detailed Analytics Row -->
      <div class="dashboard-details-row">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Floor Status overview -->
          <div class="card">
            <h3 style="margin-bottom: 16px;">Dine-In Floor Map Quick Status</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px;">
              ${data.tables.map(t => {
                let color = 'var(--bg-tertiary)';
                if (t.status === 'free') color = 'var(--status-free)';
                if (t.status === 'occupied') color = 'var(--status-occupied)';
                if (t.status === 'reserved') color = 'var(--status-reserved)';
                if (t.status === 'bill_requested') color = 'var(--status-bill-requested)';
                if (t.status === 'cleaning') color = 'var(--status-cleaning)';
                
                return `
                  <div style="background: var(--bg-primary); border-top: 3px solid ${color}; padding: 10px; border-radius: var(--radius-sm); text-align: center; border-left: 1px solid var(--bg-tertiary); border-right: 1px solid var(--bg-tertiary); border-bottom: 1px solid var(--bg-tertiary);">
                    <div style="font-size: 14px; font-weight: 800; font-family: var(--font-display);">T-${t.number}</div>
                    <div style="font-size: 9px; color: var(--text-secondary); margin-top: 4px; text-transform: uppercase; font-weight: bold;">
                      ${t.status.replace('_', ' ')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Sales Categories Chart -->
          <div class="card">
            <h3 style="margin-bottom: 16px;">Sales Share by Category</h3>
            ${categoriesHtml}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Popular Items -->
          <div class="card">
            <h3 style="margin-bottom: 16px;">Top Selling Dishes</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${popularItemsHtml}
            </div>
          </div>

          <!-- Live Activity Log -->
          <div class="card">
            <h3 style="margin-bottom: 12px;">Live Activity Feed</h3>
            <div class="recent-activity-list">
              ${data.logs.slice(0, 15).map(log => `
                <div class="activity-item" style="border-left-color: ${log.user.includes('Customer') ? 'var(--status-reserved)' : log.user.includes('Kitchen') ? 'var(--status-cleaning)' : 'var(--accent-color)'}">
                  <div style="display: flex; flex-direction: column;">
                    <strong>${log.action}</strong>
                    <span style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                      By ${log.user}
                    </span>
                  </div>
                  <span style="font-family: monospace; font-size: 11px; color: var(--text-secondary);">
                    ${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Refresh listener
    container.querySelector('#refresh-dashboard').addEventListener('click', () => {
      this.render(container);
    });
  }
};
