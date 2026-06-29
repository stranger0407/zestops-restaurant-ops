// js/components/kds.js
import db from '../db.js';

export default {
  render(container) {
    const data = db.getData();
    let selectedStation = 'All';

    const renderKOTs = () => {
      // Find active KOTs (preparing or ready)
      const activeKOTs = data.kots.filter(k => k.status === 'preparing' || k.status === 'ready');
      
      const filteredKOTs = activeKOTs.filter(k => {
        return selectedStation === 'All' || k.station === selectedStation;
      });

      const kdsGrid = container.querySelector('#kds-cards-grid');
      if (!kdsGrid) return;

      if (filteredKOTs.length === 0) {
        kdsGrid.innerHTML = `
          <div style="grid-column: 1/-1; padding: 60px; text-align: center; color: var(--text-secondary);">
            👨‍🍳 Kitchen Queue is Empty! Keep it up!
          </div>
        `;
        return;
      }

      kdsGrid.innerHTML = filteredKOTs.map(kot => {
        // Calculate age
        const elapsedMs = Date.now() - new Date(kot.createdAt).getTime();
        const mins = Math.floor(elapsedMs / 60000);
        
        // Priority coloring
        let priorityClass = kot.priority === 'high' ? 'priority-high' : '';
        let priorityColor = kot.priority === 'high' ? 'var(--danger-color)' : 'var(--accent-color)';
        
        let ageColor = 'var(--text-secondary)';
        if (mins > 10) ageColor = 'var(--warning-color)';
        if (mins > 15) ageColor = 'var(--danger-color)';

        return `
          <div class="kot-card ${priorityClass}" style="border-top-color: ${priorityColor};">
            <div class="kot-header">
              <div>
                <span class="kot-table-num">T-${kot.tableNumber}</span>
                <span style="font-size: 11px; margin-left: 6px; background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                  #${kot.kotNumber}
                </span>
              </div>
              <div class="kot-meta">
                <span style="color: ${ageColor}; font-weight: bold; font-family: monospace;">⏳ ${mins}m ago</span>
                <span>${kot.station}</span>
              </div>
            </div>
            
            <ul class="kot-items-list">
              ${kot.items.map(item => `
                <li class="kot-item">
                  <div class="kot-item-row">
                    <span class="kot-item-name">
                      <span class="kot-item-qty">${item.quantity}x</span> ${item.name}
                    </span>
                  </div>
                  ${item.modifications.length > 0 ? `
                    <span class="kot-item-mods">Mods: ${item.modifications.join(', ')}</span>
                  ` : ''}
                </li>
              `).join('')}
            </ul>
            
            <div class="kot-actions">
              ${kot.status === 'preparing' ? `
                <button class="btn btn-primary btn-bump-ready" data-kot-id="${kot.id}" style="padding: 10px 0; font-size: 13px;">
                  Mark Ready to Serve
                </button>
              ` : `
                <div style="display: flex; gap: 6px; width: 100%;">
                  <button class="btn btn-success btn-bump-complete" data-kot-id="${kot.id}" style="flex: 2; padding: 10px 0; font-size: 13px;">
                    Bump / Serve Complete
                  </button>
                  <button class="btn btn-secondary btn-print-kot" data-kot-id="${kot.id}" style="flex: 1; padding: 10px 0; font-size: 13px;">
                    Print
                  </button>
                </div>
              `}
            </div>
          </div>
        `;
      }).join('');

      // Actions bindings
      kdsGrid.querySelectorAll('.btn-bump-ready').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-kot-id');
          db.updateKOTStatus(id, 'ready');
          
          if (window.playNotificationSound) {
            window.playNotificationSound(700, 0.1, 'sine');
          }
          
          db.addLog('Kitchen Staff', `KOT marked ready.`);
          alert('Ticket marked as ready. Captains notified.');
          renderKOTs();
        });
      });

      kdsGrid.querySelectorAll('.btn-bump-complete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-kot-id');
          db.updateKOTStatus(id, 'bumped');
          
          if (window.playNotificationSound) {
            window.playNotificationSound(900, 0.1, 'sine');
          }
          
          renderKOTs();
        });
      });

      kdsGrid.querySelectorAll('.btn-print-kot').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-kot-id');
          const kot = data.kots.find(k => k.id === id);
          simulateThermalPrint(kot);
        });
      });
    };

    const simulateThermalPrint = (kot) => {
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>Simulating Thermal Print (80mm)</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 15px;">
          <div class="thermal-receipt-preview">
            <div class="receipt-header">
              <span class="receipt-logo">*** KITCHEN ORDER TICKET ***</span>
              <span>Table: ${kot.tableNumber}</span>
              <span>KOT #${kot.kotNumber}</span>
              <span>Station: ${kot.station}</span>
              <span>Time: ${kot.timestamp}</span>
            </div>
            <div class="receipt-divider"></div>
            <table class="receipt-items-table">
              <thead>
                <tr style="text-align: left;">
                  <th>Item</th>
                  <th style="text-align: right;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${kot.items.map(item => `
                  <tr>
                    <td>
                      ${item.name}
                      ${item.modifications.length > 0 ? `<br><small style="color: #666; font-style: italic;">* ${item.modifications.join(', ')}</small>` : ''}
                    </td>
                    <td style="text-align: right; font-weight: bold;">${item.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="receipt-divider"></div>
            <div style="text-align: center; font-size: 11px; margin-top: 10px;">
              -- Routed to ${kot.station} Printer --
            </div>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-secondary modal-close-btn">Close</button>
            <button class="btn btn-primary" onclick="window.print()">🖨️ Real Print</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      
      const closeModal = () => modal.style.display = 'none';
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));
    };

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">Kitchen Display System (KDS)</h1>
        
        <div class="kds-stations-bar" style="gap: 15px;">
          <div class="floor-tabs" id="kds-station-tabs">
            <button class="floor-tab active" data-station="All">All Stations</button>
            <button class="floor-tab" data-station="Grill & Fry">Grill & Fry</button>
            <button class="floor-tab" data-station="Oven">Wok & Oven</button>
            <button class="floor-tab" data-station="Bar">Beverage & Bar</button>
            <button class="floor-tab" data-station="Pantry">Pantry / Salad</button>
          </div>
        </div>
      </div>

      <div class="kds-grid" id="kds-cards-grid">
        <!-- Rendered tickets -->
      </div>
    `;

    renderKOTs();

    // Station tab switch
    container.querySelectorAll('#kds-station-tabs .floor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('#kds-station-tabs .floor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedStation = tab.getAttribute('data-station');
        renderKOTs();
      });
    });
  }
};
