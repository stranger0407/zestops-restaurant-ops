// js/components/qrMenu.js
import db from '../db.js';

export default {
  render(container, routerNavigate, tableId = null) {
    const data = db.getData();
    
    // Simulate table 4 if none provided
    if (!tableId) {
      tableId = 'T4';
    }

    const table = data.tables.find(t => t.id === tableId) || data.tables[0];
    const order = data.orders.find(o => o.tableId === table.id && o.status !== 'settled') || db.getOrCreateOrderForTable(table.id);

    let activeCategory = 'All';
    const localCart = []; // Temporary cart for items before placing order

    const renderQrView = () => {
      // 1. Build category buttons HTML
      const categories = ['All', 'Starters', 'Mains', 'Desserts', 'Beverages'];
      const categoriesHtml = categories.map(cat => `
        <button class="floor-tab qr-cat-tab ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}" style="padding: 6px 12px; font-size: 12px;">
          ${cat}
        </button>
      `).join('');

      // 2. Build Menu List HTML
      const filteredMenu = data.menu.filter(m => {
        return m.available && (activeCategory === 'All' || m.category === activeCategory);
      });

      const menuHtml = filteredMenu.map(item => `
        <div style="background: var(--bg-secondary); border: 1px solid var(--bg-tertiary); border-radius: var(--radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <div style="flex: 1;">
            <strong style="font-size: 14px; display: block; color: var(--text-primary);">${item.name}</strong>
            <span style="font-size: 11px; color: var(--text-secondary); line-height: 1.2; display: block; margin-top: 4px;">
              ${item.description}
            </span>
            <strong style="color: var(--accent-color); font-size: 13px; display: block; margin-top: 4px;">
              $${item.price.toFixed(2)}
            </strong>
          </div>
          <button class="btn btn-primary qr-add-to-cart-btn" data-item-id="${item.id}" style="padding: 6px 12px; font-size: 12px;">
            + Add
          </button>
        </div>
      `).join('');

      // 3. Build Active Order Status Timeline HTML
      let timelineHtml = '';
      if (order && order.items.length > 0) {
        let statusText = 'Order Placed';
        let step = 1; // 1: placed, 2: preparing, 3: ready, 4: bill asked
        
        if (order.status === 'preparing') {
          statusText = 'Preparing in Kitchen';
          step = 2;
        } else if (order.status === 'ready_to_serve') {
          statusText = 'Dishes Ready / Served';
          step = 3;
        }
        
        if (table.status === 'bill_requested') {
          statusText = 'Bill Requested';
          step = 4;
        }

        timelineHtml = `
          <div class="card" style="padding: 12px; border-left: 3px solid var(--status-occupied);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="font-size: 13px; color: var(--text-primary);">Order Tracker</strong>
              <span class="badge" style="background: var(--status-occupied-bg); color: var(--status-occupied); font-size: 10px;">
                ${statusText}
              </span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-secondary); position: relative; margin-top: 8px;">
              <div style="display: flex; flex-direction: column; align-items: center; opacity: ${step >= 1 ? 1 : 0.4};">
                <span>📝</span>
                <strong>Placed</strong>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; opacity: ${step >= 2 ? 1 : 0.4};">
                <span>🍳</span>
                <strong>Cooking</strong>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; opacity: ${step >= 3 ? 1 : 0.4};">
                <span>🔔</span>
                <strong>Served</strong>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; opacity: ${step >= 4 ? 1 : 0.4};">
                <span>💳</span>
                <strong>Pay</strong>
              </div>
            </div>
          </div>
        `;
      }

      // 4. Cart modal status
      const cartCount = localCart.reduce((sum, item) => sum + item.quantity, 0);

      // Render View Layout
      container.innerHTML = `
        <div class="phone-viewport">
          <div class="customer-view-container" style="height: 100%; display: flex; flex-direction: column;">
            <!-- Header -->
            <div class="customer-header" style="padding: 10px 15px; background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--bg-tertiary);">
              <div style="display: flex; flex-direction: column;">
                <strong style="font-size: 15px; color: var(--text-primary);">ZestCafe Dine-In</strong>
                <span style="font-size: 11px; color: var(--text-secondary);">Table ${table.number}</span>
              </div>
              
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" id="qr-call-waiter-btn" style="padding: 6px; font-size: 12px; background: var(--warning-bg); border-color: rgba(249, 115, 22, 0.2); color: var(--warning-color);">
                  🛎️ Call Staff
                </button>
                <button class="btn btn-secondary" id="qr-request-bill-btn" style="padding: 6px; font-size: 12px; background: var(--status-bill-requested-bg); border-color: rgba(234, 179, 8, 0.2); color: var(--status-bill-requested);">
                  💳 Bill
                </button>
              </div>
            </div>

            <!-- Content Area -->
            <div class="customer-menu-layout" style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 12px;">
              <!-- Timeline status tracker -->
              ${timelineHtml}

              <!-- Menu Header -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <h3 style="font-size: 16px; margin: 0;">Digital Menu</h3>
                <select id="qr-table-picker" class="form-input" style="padding: 2px 4px; font-size: 11px; height: 24px; width: 90px; background: var(--bg-secondary);">
                  ${data.tables.map(t => `<option value="${t.id}" ${t.id === tableId ? 'selected' : ''}>Table ${t.number}</option>`).join('')}
                </select>
              </div>

              <!-- Categories -->
              <div class="floor-tabs" style="gap: 5px; overflow-x: auto; padding-bottom: 4px;">
                ${categoriesHtml}
              </div>

              <!-- Menu Items Outlet -->
              <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
                ${menuHtml}
              </div>
            </div>

            <!-- Floating Cart Panel if items added -->
            ${cartCount > 0 ? `
              <div style="background: var(--bg-secondary); border-top: 1px solid var(--bg-tertiary); padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; flex-direction: column;">
                  <strong style="font-size: 14px; color: var(--text-primary);">${cartCount} Items Selected</strong>
                  <span style="font-size: 11px; color: var(--text-secondary);">
                    Est: $${localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <button class="btn btn-primary" id="qr-place-order-btn" style="padding: 8px 16px; font-size: 12px;">
                  🚀 Place Order
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Event listeners
      // 1. Table switcher
      const picker = container.querySelector('#qr-table-picker');
      if (picker) {
        picker.addEventListener('change', (e) => {
          const newTableId = e.target.value;
          routerNavigate(`#qr-menu?tableId=${newTableId}`);
        });
      }

      // 2. Call waiter
      container.querySelector('#qr-call-waiter-btn').addEventListener('click', () => {
        const option = prompt('What do you need assistance with?\n1. Water\n2. Call Waiter\n3. Clean Table\nEnter choice or write comment:');
        let msg = 'Assistance requested';
        if (option === '1') msg = 'Requested Water';
        else if (option === '2') msg = 'Requested Waiter';
        else if (option === '3') msg = 'Requested table cleaning';
        else if (option) msg = option;
        
        db.callStaff(table.id, msg);
        if (window.playNotificationSound) {
          window.playNotificationSound(440, 0.2, 'sine');
        }
        alert('Staff has been called. A Captain will arrive shortly.');
        routerNavigate(`#qr-menu?tableId=${table.id}`);
      });

      // 3. Request Bill
      container.querySelector('#qr-request-bill-btn').addEventListener('click', () => {
        if (confirm('Are you ready to request the bill and check out?')) {
          db.requestBill(table.id);
          alert('Bill request sent. Cashier terminal has been notified.');
          routerNavigate(`#qr-menu?tableId=${table.id}`);
        }
      });

      // 4. Category Tabs
      container.querySelectorAll('.qr-cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          activeCategory = tab.getAttribute('data-cat');
          renderQrView();
        });
      });

      // 5. Add to local cart
      container.querySelectorAll('.qr-add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const itemId = btn.getAttribute('data-item-id');
          const menuItem = data.menu.find(m => m.id === itemId);
          
          const existing = localCart.find(c => c.id === menuItem.id);
          if (existing) {
            existing.quantity++;
          } else {
            localCart.push({
              id: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              quantity: 1,
              modifications: [],
              sentToKOT: false,
              seatNumber: 1
            });
          }
          renderQrView();
        });
      });

      // 6. Place Order
      const placeBtn = container.querySelector('#qr-place-order-btn');
      if (placeBtn) {
        placeBtn.addEventListener('click', () => {
          const currentOrder = db.getOrCreateOrderForTable(table.id);
          
          // Merge localCart into order items
          localCart.forEach(localItem => {
            const existing = currentOrder.items.find(oi => oi.id === localItem.id && !oi.sentToKOT);
            if (existing) {
              existing.quantity += localItem.quantity;
            } else {
              currentOrder.items.push(localItem);
            }
          });

          db.saveOrder(currentOrder);
          db.sendToKitchen(currentOrder.id, 'high', 'Tableside Customer');
          db.addLog('Customer', `Placed order tableside for Table ${table.number}`);
          
          // Clear temp local cart
          localCart.length = 0;
          
          if (window.playNotificationSound) {
            window.playNotificationSound(880, 0.1, 'triangle');
            setTimeout(() => window.playNotificationSound(1100, 0.15), 100);
          }
          
          alert('Your order has been placed and sent straight to the kitchen!');
          routerNavigate(`#qr-menu?tableId=${table.id}`);
        });
      }
    };

    renderQrView();
  }
};
