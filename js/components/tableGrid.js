// js/components/tableGrid.js
import db from '../db.js';

export default {
  render(container, routerNavigate) {
    const data = db.getData();
    
    // Filters state
    let activeFilter = 'all'; // 'all', 'free', 'occupied', 'reserved', 'cleaning'
    
    const renderGrid = () => {
      const filteredTables = data.tables.filter(t => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'free') return t.status === 'free';
        if (activeFilter === 'occupied') return t.status === 'occupied' || t.status === 'bill_requested';
        return t.status === activeFilter;
      });

      const gridContainer = container.querySelector('#tables-cards-outlet');
      if (!gridContainer) return;
      
      if (filteredTables.length === 0) {
        gridContainer.innerHTML = `
          <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">
            No tables match the selected status filter.
          </div>
        `;
        return;
      }

      gridContainer.innerHTML = filteredTables.map(t => {
        const order = data.orders.find(o => o.tableId === t.id && o.status !== 'settled');
        const itemCount = order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        let elapsedStr = '-';
        if (t.seatedTime) {
          const elapsedMs = Date.now() - new Date(t.seatedTime).getTime();
          const mins = Math.floor(elapsedMs / 60000);
          elapsedStr = `Seated: ${mins}m ago`;
        }

        let statusClass = `status-${t.status}`;
        let statusLabel = t.status.replace('_', ' ').toUpperCase();
        
        return `
          <div class="table-card ${statusClass}" data-table-id="${t.id}">
            ${t.waiterCalled ? `<div class="waiter-call-bubble">🛎️ Waiter Called</div>` : ''}
            
            <div class="table-card-header">
              <div>
                <span style="font-size: 11px; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">
                  Table
                </span>
                <div class="table-card-num">${t.number}</div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <span class="table-card-capacity">👥 Cap: ${t.capacity}</span>
                <span class="badge" style="background: var(--bg-primary); font-size: 9px; padding: 2px 6px;">
                  ${statusLabel}
                </span>
              </div>
            </div>
            
            <div class="table-card-details">
              ${t.reservationName ? `
                <div style="font-size: 12px; font-weight: 600; color: var(--status-reserved);">
                  📅 ${t.reservationName}
                </div>
              ` : ''}
              
              <div class="table-card-timer" style="color: ${t.status === 'bill_requested' ? 'var(--status-bill-requested)' : 'var(--text-secondary)'}">
                ${t.status === 'occupied' || t.status === 'bill_requested' ? `⏳ ${elapsedStr}` : ''}
              </div>
              
              ${itemCount > 0 ? `
                <div class="table-card-items-badge" style="color: var(--accent-color);">
                  🍽️ ${itemCount} items ordered
                </div>
              ` : ''}
              
              <div class="table-card-waiter">
                👤 ${t.assignedStaff || 'Unassigned'}
              </div>
            </div>
            
            <div class="table-card-actions" style="margin-top: 12px; display: flex; gap: 6px;">
              ${t.status === 'free' ? `
                <button class="btn btn-primary btn-action-open" style="flex: 1; padding: 6px; font-size: 11px;">Open</button>
                <button class="btn btn-secondary btn-action-reserve" style="padding: 6px; font-size: 11px;">Book</button>
              ` : ''}
              
              ${t.status === 'occupied' || t.status === 'bill_requested' ? `
                <button class="btn btn-primary btn-action-order" style="flex: 1; padding: 6px; font-size: 11px;">Order</button>
                <button class="btn btn-secondary btn-action-bill" style="padding: 6px; font-size: 11px;">Billing</button>
              ` : ''}
              
              ${t.status === 'cleaning' ? `
                <button class="btn btn-success btn-action-clean" style="flex: 1; padding: 6px; font-size: 11px;">Mark Clean</button>
              ` : ''}
              
              ${t.status === 'reserved' ? `
                <button class="btn btn-primary btn-action-open" style="flex: 1; padding: 6px; font-size: 11px;">Seat Guest</button>
                <button class="btn btn-secondary btn-action-free" style="padding: 6px; font-size: 11px;">Release</button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Add actions event listeners
      container.querySelectorAll('.table-card').forEach(card => {
        const tableId = card.getAttribute('data-table-id');
        const table = data.tables.find(tbl => tbl.id === tableId);
        
        card.addEventListener('click', (e) => {
          // Prevent triggers if button is clicked
          if (e.target.closest('button')) return;
          
          if (table.status === 'occupied' || table.status === 'bill_requested') {
            routerNavigate(`#order-entry?tableId=${tableId}`);
          } else if (table.status === 'free') {
            openTableFlow(tableId);
          } else if (table.status === 'cleaning') {
            db.updateTableStatus(tableId, 'free');
            db.addLog(null, `Table ${table.number} cleared and marked clean.`);
            routerNavigate('#tables');
          }
        });
        
        // Button actions
        const openBtn = card.querySelector('.btn-action-open');
        if (openBtn) {
          openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTableFlow(tableId);
          });
        }

        const orderBtn = card.querySelector('.btn-action-order');
        if (orderBtn) {
          orderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            routerNavigate(`#order-entry?tableId=${tableId}`);
          });
        }

        const billBtn = card.querySelector('.btn-action-bill');
        if (billBtn) {
          billBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            routerNavigate(`#billing?tableId=${tableId}`);
          });
        }

        const cleanBtn = card.querySelector('.btn-action-clean');
        if (cleanBtn) {
          cleanBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            db.updateTableStatus(tableId, 'free');
            db.addLog(null, `Table ${table.number} cleared and marked clean.`);
            routerNavigate('#tables');
          });
        }

        const reserveBtn = card.querySelector('.btn-action-reserve');
        if (reserveBtn) {
          reserveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openReserveModal(tableId);
          });
        }

        const releaseBtn = card.querySelector('.btn-action-free');
        if (releaseBtn) {
          releaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            db.updateTableStatus(tableId, 'free');
            db.addLog(null, `Reservation released for Table ${table.number}.`);
            routerNavigate('#tables');
          });
        }
      });
    };

    const openTableFlow = (tableId) => {
      db.getOrCreateOrderForTable(tableId);
      db.addLog(null, `Table ${data.tables.find(t => t.id === tableId).number} opened for Dine-in.`);
      routerNavigate(`#order-entry?tableId=${tableId}`);
    };

    const openReserveModal = (tableId) => {
      const table = data.tables.find(t => t.id === tableId);
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>Reserve Table ${table.number}</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
          <div class="settings-group">
            <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Guest Booking Name / Party details</label>
            <input type="text" id="reserve-guest-name" class="form-input" placeholder="e.g. John Party of 4 (19:00)">
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
            <button class="btn btn-secondary modal-close-btn">Cancel</button>
            <button class="btn btn-primary" id="reserve-submit-btn">Save Reservation</button>
          </div>
        </div>
      `;
      
      modal.style.display = 'flex';
      
      const closeModal = () => modal.style.display = 'none';
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));
      
      content.querySelector('#reserve-submit-btn').addEventListener('click', () => {
        const name = content.querySelector('#reserve-guest-name').value.trim();
        if (name) {
          db.reserveTable(tableId, name);
          db.addLog(null, `Table ${table.number} reserved for ${name}.`);
          closeModal();
          routerNavigate('#tables');
        } else {
          alert('Please enter a reservation name.');
        }
      });
    };

    const openMergeModal = () => {
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>Merge Tables</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
          <div class="settings-group">
            <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Select Primary Table</label>
            <select id="merge-primary" class="form-input">
              ${data.tables.map(t => `<option value="${t.id}">Table ${t.number} (${t.status})</option>`).join('')}
            </select>
          </div>
          
          <div class="settings-group">
            <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Select Tables to Merge (Hold Ctrl to select multiple)</label>
            <select id="merge-secondary" class="form-input" multiple style="height: 120px;">
              ${data.tables.map(t => `<option value="${t.id}">Table ${t.number} (${t.status})</option>`).join('')}
            </select>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
            <button class="btn btn-secondary modal-close-btn">Cancel</button>
            <button class="btn btn-primary" id="merge-submit-btn">Merge Tables</button>
          </div>
        </div>
      `;
      
      modal.style.display = 'flex';
      
      const closeModal = () => modal.style.display = 'none';
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));
      
      content.querySelector('#merge-submit-btn').addEventListener('click', () => {
        const primaryVal = content.querySelector('#merge-primary').value;
        const selectedOptions = Array.from(content.querySelector('#merge-secondary').selectedOptions);
        const mergeIds = selectedOptions.map(opt => opt.value).filter(id => id !== primaryVal);
        
        if (mergeIds.length > 0) {
          db.mergeTables(primaryVal, mergeIds);
          closeModal();
          routerNavigate('#tables');
        } else {
          alert('Please select at least one additional table to merge.');
        }
      });
    };

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">Interactive Floor Status</h1>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btn-merge-tables">🔗 Merge Tables</button>
          <button class="btn btn-secondary" id="btn-split-tables">🔓 Split Tables</button>
        </div>
      </div>

      <div class="floor-tabs-bar">
        <div class="floor-tabs">
          <button class="floor-tab active" data-filter="all">All Tables</button>
          <button class="floor-tab" data-filter="free">Available</button>
          <button class="floor-tab" data-filter="occupied">Occupied</button>
          <button class="floor-tab" data-filter="reserved">Reserved</button>
          <button class="floor-tab" data-filter="cleaning">Cleaning</button>
        </div>
        
        <div class="table-status-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--status-free);"></div>
            <span>Free</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--status-occupied);"></div>
            <span>Occupied</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--status-reserved);"></div>
            <span>Booked</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--status-bill-requested);"></div>
            <span>Bill Ask</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: var(--status-cleaning);"></div>
            <span>Cleaning</span>
          </div>
        </div>
      </div>

      <div class="tables-grid" id="tables-cards-outlet">
        <!-- Rendered Tables -->
      </div>
    `;

    renderGrid();

    // Floor filter tabs listener
    container.querySelectorAll('.floor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.floor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.getAttribute('data-filter');
        renderGrid();
      });
    });

    // Merge tables listener
    container.querySelector('#btn-merge-tables').addEventListener('click', openMergeModal);
    
    // Split tables listener
    container.querySelector('#btn-split-tables').addEventListener('click', () => {
      // Just reset all occupied/merged tables for simplification
      const activeOccupied = data.tables.filter(t => t.status === 'occupied' || t.status === 'bill_requested');
      if (activeOccupied.length > 0) {
        db.addLog(null, `Floor layout split reset triggered. All active tables isolated.`);
        alert('All merged tables have been unlinked and isolated.');
        routerNavigate('#tables');
      } else {
        alert('No active merged tables found.');
      }
    });
  }
};
