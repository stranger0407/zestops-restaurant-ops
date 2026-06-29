// js/components/settings.js
import db from '../db.js';

export default {
  render(container, routerNavigate) {
    const data = db.getData();

    const renderSettings = () => {
      // 1. Build menu management list
      const menuListHtml = data.menu.map(item => `
        <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--bg-tertiary);">
          <div>
            <strong>${item.name}</strong>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Category: ${item.category} • Price: $${item.price.toFixed(2)} • Station: ${item.station}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
              <input type="checkbox" class="chk-menu-avail" data-item-id="${item.id}" ${item.available ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
              <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${item.available ? 'var(--status-free)' : '#4b5563'}; transition: .3s; border-radius: 20px;"></span>
            </label>
            <span style="font-size: 12px; font-weight: 600; width: 80px; text-align: right;">
              ${item.available ? 'Available' : 'Snoozed'}
            </span>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="screen-header">
          <h1 class="screen-title">System Settings & Menu Controls</h1>
        </div>

        <div class="settings-form-grid">
          <!-- Left Column: Configurations -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Printer configuration -->
            <div class="card">
              <h3 style="margin-bottom: 16px;">🖨️ Station Printers (Thermal Routing)</h3>
              
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div class="settings-group">
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Kitchen Station IP Address / Port</label>
                  <input type="text" id="setting-printer-ip" class="form-input" value="${data.settings.printerIP || '192.168.1.200'}">
                </div>

                <div class="settings-group">
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Receipt Size Format</label>
                  <select id="setting-receipt-size" class="form-input">
                    <option value="80mm" ${data.settings.receiptSize === '80mm' ? 'selected' : ''}>Standard Thermal 80mm</option>
                    <option value="58mm" ${data.settings.receiptSize === '58mm' ? 'selected' : ''}>Mobile Bluetooth 58mm</option>
                  </select>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                  <input type="checkbox" id="setting-auto-print-kot" ${data.settings.autoPrintKOT ? 'checked' : ''}>
                  <label for="setting-auto-print-kot" style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">
                    Auto-print physical KOT paper on order submit
                  </label>
                </div>

                <button class="btn btn-primary" id="btn-save-printer-settings" style="margin-top: 10px;">Save Configuration</button>
              </div>
            </div>

            <!-- Testing and Simulation Controls -->
            <div class="card" style="border-left: 3px solid var(--status-reserved);">
              <h3 style="margin-bottom: 16px; color: var(--status-reserved);">⚡ Simulator Testing Panel</h3>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 15px;">
                Controls to verify real-time actions and trigger simulated aggregator events.
              </p>
              
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="btn btn-secondary" id="btn-sim-trigger-delivery" style="justify-content: flex-start;">
                  🛵 Spawn Mock Swiggy/Zomato Order
                </button>
                <button class="btn btn-secondary" id="btn-sim-trigger-call" style="justify-content: flex-start;">
                  🛎️ Trigger Random Customer Call (Table 3)
                </button>
                <button class="btn btn-secondary" id="btn-sim-reset-demo" style="justify-content: flex-start; border-color: var(--danger-color); color: var(--danger-color);">
                  🗑️ Reset All Databases to Demo Defaults
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: Menu Availability -->
          <div class="card" style="display: flex; flex-direction: column; gap: 16px; max-height: calc(100vh - var(--header-height) - 100px); overflow-y: auto;">
            <div>
              <h3>📋 Dish Availability & Stock Control</h3>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Toggle items out-of-stock instantly to block waitstaff and customers from ordering them.
              </p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${menuListHtml}
            </div>
          </div>
        </div>
      `;

      // Availability check listener
      container.querySelectorAll('.chk-menu-avail').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const itemId = chk.getAttribute('data-item-id');
          db.setMenuAvailability(itemId, chk.checked);
          renderSettings();
        });
      });

      // Save printer configs
      container.querySelector('#btn-save-printer-settings').addEventListener('click', () => {
        const ip = container.querySelector('#setting-printer-ip').value;
        const size = container.querySelector('#setting-receipt-size').value;
        const auto = container.querySelector('#setting-auto-print-kot').checked;
        db.updatePrinterSettings(ip, size, auto);
        alert('Printer routing settings saved successfully!');
      });

      // Spawn aggregator
      container.querySelector('#btn-sim-trigger-delivery').addEventListener('click', () => {
        const platforms = ['Swiggy', 'Zomato'];
        const plat = platforms[Math.floor(Math.random() * platforms.length)];
        const orderNum = 'SW-' + Math.floor(10000 + Math.random() * 90000);
        
        db.addAggregatorOrder(plat, orderNum, [
          { name: 'Classic Beef Burger', price: 13.99, quantity: 1, modifications: [] },
          { name: 'Mineral Water', price: 1.99, quantity: 2, modifications: [] }
        ], 'Simulated incoming delivery feed');
        
        if (window.playNotificationSound) {
          window.playNotificationSound(600, 0.3, 'sawtooth');
        }
        alert('Simulated Aggregator order spawned! Check the Aggregator Orders screen.');
      });

      // Trigger table assistance
      container.querySelector('#btn-sim-trigger-call').addEventListener('click', () => {
        db.callStaff('T3', 'Customer requests extra napkins');
        if (window.playNotificationSound) {
          window.playNotificationSound(440, 0.25, 'sine');
        }
        alert('Simulated call sent from Table 3. Look at the notification bell icon or table floor map.');
      });

      // Reset db
      container.querySelector('#btn-sim-reset-demo').addEventListener('click', () => {
        if (confirm('Warning: This will wipe all current orders, sales, and custom changes, and reset to standard demo parameters. Proceed?')) {
          db.reset();
          alert('Database reset completed successfully!');
          routerNavigate('#dashboard');
        }
      });
    };

    renderSettings();
  }
};
