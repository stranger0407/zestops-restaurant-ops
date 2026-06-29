// js/components/reports.js
import db from '../db.js';

export default {
  render(container, routerNavigate) {
    const data = db.getData();
    const report = db.getDailyReportDetails();

    const renderReports = () => {
      // 1. Build Payment method list
      const paymentBreakdownHtml = Object.entries(report.paymentBreakdown).map(([method, amount]) => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed var(--bg-tertiary);">
          <span>${method}</span>
          <strong style="color: var(--accent-color);">$${amount.toFixed(2)}</strong>
        </div>
      `).join('');

      // 2. Turnaround Times logs
      // Generate some mockup logs for completed tables turnaround times
      const turnaroundMocks = [
        { tableNum: '1', duration: 42, guests: 2, time: '11:15 AM' },
        { tableNum: '5', duration: 58, guests: 4, time: '12:05 PM' },
        { tableNum: '2', duration: 33, guests: 1, time: '12:40 PM' }
      ];

      const turnaroundHtml = turnaroundMocks.map(mock => `
        <tr style="font-size: 12px; border-bottom: 1px solid var(--bg-tertiary);">
          <td style="padding: 8px 0;">Table ${mock.tableNum}</td>
          <td>${mock.guests} Guests</td>
          <td style="color: var(--status-free); font-weight: 600;">${mock.duration} minutes</td>
          <td style="color: var(--text-muted);">${mock.time}</td>
        </tr>
      `).join('');

      // 3. Audit History for edits & cancellations
      const auditHtml = data.auditHistory.length > 0 
        ? data.auditHistory.map(audit => `
            <div class="activity-item" style="border-left-color: var(--danger-color); font-size: 12px; padding: 8px 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <div style="display: flex; flex-direction: column;">
                <strong>${audit.action}</strong>
                <span style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                  Table: ${audit.table} • Auth: ${audit.authorizedBy}
                </span>
              </div>
              <span style="font-family: monospace; font-size: 10px; color: var(--text-secondary);">
                ${new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          `).join('')
        : `<p style="font-size: 13px; color: var(--text-muted);">No modifications or audits logged today.</p>`;

      container.innerHTML = `
        <div class="screen-header">
          <h1 class="screen-title">Operational Reports & Audits</h1>
          <button class="btn btn-danger" id="btn-trigger-close-day">🔒 Run Day Closing (Z-Report)</button>
        </div>

        <div class="reports-layout">
          <!-- Daily financial metrics -->
          <div class="report-row-summary">
            <div class="card metric-card">
              <span class="metric-title">Gross Revenue</span>
              <div class="metric-value" style="color: var(--status-free);">$${report.totalSales.toFixed(2)}</div>
              <span style="font-size: 11px; color: var(--text-secondary);">Subtotal: $${report.totalSubtotal.toFixed(2)}</span>
            </div>
            
            <div class="card metric-card">
              <span class="metric-title">Taxes (GST 5%)</span>
              <div class="metric-value">$${report.totalTax.toFixed(2)}</div>
              <span style="font-size: 11px; color: var(--text-secondary);">Auto Collected</span>
            </div>

            <div class="card metric-card">
              <span class="metric-title">Service Charges</span>
              <div class="metric-value">$${report.totalService.toFixed(2)}</div>
              <span style="font-size: 11px; color: var(--text-secondary);">In-house 10% share</span>
            </div>

            <div class="card metric-card">
              <span class="metric-title">Staff Tips</span>
              <div class="metric-value" style="color: var(--status-reserved);">$${report.totalTip.toFixed(2)}</div>
              <span style="font-size: 11px; color: var(--text-secondary);">Allocated to Server pool</span>
            </div>
          </div>

          <!-- Detailed summaries -->
          <div class="report-details-grid">
            <!-- Left col -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <!-- Payments Breakdown -->
              <div class="card">
                <h3 style="margin-bottom: 15px;">Revenue Share by Payment Method</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${paymentBreakdownHtml}
                </div>
              </div>

              <!-- Table Turnaround Tracking -->
              <div class="card">
                <h3 style="margin-bottom: 12px;">Dine-In Table Turnaround Tracking</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                  <thead>
                    <tr style="font-size: 12px; color: var(--text-secondary); border-bottom: 1px dashed var(--bg-tertiary);">
                      <th style="padding-bottom: 8px;">Table</th>
                      <th>Guests</th>
                      <th>Stay Duration</th>
                      <th>Settle Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${turnaroundHtml}
                  </tbody>
                </table>
                <div style="margin-top: 15px; font-size: 12px; color: var(--text-secondary); background: var(--bg-primary); padding: 8px; border-radius: 4px; text-align: center;">
                  💡 Average Table Turnaround Time: <strong style="color: var(--status-free);">44.3 minutes</strong>
                </div>
              </div>
            </div>

            <!-- Right col -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <!-- Audit Logs -->
              <div class="card" style="border-left: 3px solid var(--danger-color);">
                <h3 style="margin-bottom: 15px; color: var(--danger-color);">Order Edits & Audit History</h3>
                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
                  ${auditHtml}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Closing operation trigger
      container.querySelector('#btn-trigger-close-day').addEventListener('click', () => {
        const activeOrders = data.orders.filter(o => o.status !== 'settled' && o.status !== 'cancelled');
        if (activeOrders.length > 0) {
          alert(`Day Closing Failed: There are still ${activeOrders.length} active tables. Please settle or void all orders before closing.`);
          return;
        }

        if (confirm('CAUTION: Are you sure you want to close the day?\nThis will generate the final Z-Report, lock all transactions, and clear active tables, KOTs, and logs for next service.')) {
          try {
            const zReport = db.closeDay('Sarah (Manager)');
            showZReportModal(zReport);
          } catch (err) {
            alert(err.message);
          }
        }
      });
    };

    const showZReportModal = (report) => {
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>🔒 Z-REPORT (End of Day Lock)</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 15px;">
          <p style="font-size: 13px; color: var(--text-secondary);">
            The day has been closed successfully. Operations have been reset. Here is the locked Z-report for print:
          </p>
          <div class="thermal-receipt-preview">
            <div class="receipt-header">
              <span class="receipt-logo">*** FINAL Z-REPORT ***</span>
              <span>ZestCafe Operations Settle</span>
              <span>Lock Timestamp: ${new Date().toLocaleString()}</span>
              <span>Closed By: Manager Sarah</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-totals" style="font-size: 12px;">
              <div class="receipt-row">
                <span>Invoices Settled:</span>
                <span>${report.salesCount}</span>
              </div>
              <div class="receipt-row" style="font-weight: bold; font-size: 14px;">
                <span>GROSS SALES REVENUE:</span>
                <span>$${report.totalSales.toFixed(2)}</span>
              </div>
              <div class="receipt-row">
                <span>Taxes collected:</span>
                <span>$${report.totalTax.toFixed(2)}</span>
              </div>
              <div class="receipt-row">
                <span>Service charge pooled:</span>
                <span>$${report.totalService.toFixed(2)}</span>
              </div>
              <div class="receipt-row">
                <span>Total Tips pooled:</span>
                <span>$${report.totalTip.toFixed(2)}</span>
              </div>
              
              <div class="receipt-divider"></div>
              
              <span style="font-weight: bold; display: block; margin-bottom: 6px;">Payment Method Totals:</span>
              ${Object.entries(report.paymentBreakdown).map(([method, amount]) => `
                <div class="receipt-row">
                  <span>- ${method}:</span>
                  <span>$${amount.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="receipt-divider"></div>
            
            <div style="text-align: center; font-size: 11px;">
              [ LOCKED & BACKED UP TO STORAGE ]
            </div>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-secondary modal-close-btn" id="z-report-done-btn">Finish & Reload App</button>
            <button class="btn btn-primary" onclick="window.print()">🖨️ Print Z-Report</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      
      const handleClose = () => {
        modal.style.display = 'none';
        routerNavigate('#login');
      };
      
      content.querySelector('#z-report-done-btn').addEventListener('click', handleClose);
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', handleClose));
    };

    renderReports();
  }
};
