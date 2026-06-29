// js/components/aggregator.js
import db from '../db.js';

export default {
  render(container) {
    const data = db.getData();

    const renderFeed = () => {
      const incoming = data.aggregators.filter(a => a.status === 'incoming');
      const preparing = data.aggregators.filter(a => a.status === 'preparing');
      const delivery = data.aggregators.filter(a => a.status === 'out_for_delivery');

      const colIncoming = container.querySelector('#col-incoming');
      const colPreparing = container.querySelector('#col-preparing');
      const colDelivery = container.querySelector('#col-delivery');

      const buildCards = (list) => {
        if (list.length === 0) {
          return `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">No orders in this stage.</div>`;
        }
        
        return list.map(order => `
          <div class="aggregator-card ${order.platform.toLowerCase()}">
            <div class="aggregator-card-header">
              <span style="font-weight: 700; color: ${order.platform.toLowerCase() === 'swiggy' ? '#fc8019' : '#cb202d'}">
                ${order.platform.toUpperCase()}
              </span>
              <span style="font-family: monospace;">#${order.orderNumber}</span>
            </div>
            
            <div style="font-size: 13px; margin: 4px 0; color: var(--text-primary);">
              ${order.items.map(item => `
                <div style="display: flex; justify-content: space-between;">
                  <span>${item.quantity}x ${item.name}</span>
                </div>
              `).join('')}
            </div>

            ${order.notes ? `
              <div style="font-size: 11px; background: var(--bg-primary); padding: 4px; border-radius: 2px; color: var(--warning-color); font-style: italic;">
                Note: ${order.notes}
              </div>
            ` : ''}
            
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px;">
              👤 Rider: ${order.riderName || 'Assigning...'} <br>
              🕒 ETA: ${order.eta || 'Calculating'}
            </div>
            
            <div style="margin-top: 10px; display: flex; gap: 6px;">
              ${order.status === 'incoming' ? `
                <button class="btn btn-primary btn-accept" data-order-id="${order.id}" style="padding: 6px; font-size: 11px; flex: 1;">
                  Accept & Cook
                </button>
                <button class="btn btn-danger btn-reject" data-order-id="${order.id}" style="padding: 6px; font-size: 11px;">
                  Reject
                </button>
              ` : ''}
              
              ${order.status === 'preparing' ? `
                <button class="btn btn-primary btn-handover" data-order-id="${order.id}" style="padding: 6px; font-size: 11px; flex: 1;">
                  Handover to Rider
                </button>
              ` : ''}

              ${order.status === 'out_for_delivery' ? `
                <button class="btn btn-success btn-complete" data-order-id="${order.id}" style="padding: 6px; font-size: 11px; flex: 1;">
                  Mark Delivered
                </button>
              ` : ''}
            </div>
          </div>
        `).join('');
      };

      if (colIncoming) colIncoming.innerHTML = buildCards(incoming);
      if (colPreparing) colPreparing.innerHTML = buildCards(preparing);
      if (colDelivery) colDelivery.innerHTML = buildCards(delivery);

      // Event bindings
      container.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.getAttribute('data-order-id');
          db.updateAggregatorStatus(orderId, 'preparing', { riderName: 'Rider Dave', phone: '+91 99999 88888', eta: '10 mins' });
          
          // Generate active Kitchen Ticket (KOT) automatically for aggregator orders
          const order = data.aggregators.find(a => a.id === orderId);
          if (order) {
            const kotNum = data.kotCounter++;
            const newKOT = {
              id: 'KOT_' + kotNum + '_' + Date.now(),
              kotNumber: kotNum,
              orderId: order.id,
              tableNumber: order.platform.toUpperCase(),
              station: 'Grill & Fry', // Default aggregator KOT routing
              items: order.items.map(i => ({ name: i.name, quantity: i.quantity, modifications: i.modifications || [] })),
              status: 'preparing',
              priority: 'high',
              createdAt: new Date().toISOString(),
              timestamp: new Date().toLocaleTimeString()
            };
            data.kots.push(newKOT);
            db.save(data);
          }
          
          alert('Delivery order accepted! KOT dispatched to Grill Station.');
          renderFeed();
        });
      });

      container.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Are you sure you want to reject this delivery order?')) {
            const orderId = btn.getAttribute('data-order-id');
            db.updateAggregatorStatus(orderId, 'rejected');
            renderFeed();
          }
        });
      });

      container.querySelectorAll('.btn-handover').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.getAttribute('data-order-id');
          db.updateAggregatorStatus(orderId, 'out_for_delivery', { eta: '15 mins' });
          renderFeed();
        });
      });

      container.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.getAttribute('data-order-id');
          db.updateAggregatorStatus(orderId, 'delivered');
          alert('Order completed successfully! Added to daily logs.');
          renderFeed();
        });
      });
    };

    const openManualOrderModal = () => {
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>Manual Delivery Entry (Phone Order)</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
          <div class="settings-group">
            <label style="font-size: 13px; font-weight: 600;">Delivery Platform / Source</label>
            <select id="manual-platform" class="form-input">
              <option value="Swiggy">Swiggy (Manual)</option>
              <option value="Zomato">Zomato (Manual)</option>
              <option value="Direct Call">Direct Call / In-House Delivery</option>
            </select>
          </div>

          <div class="settings-group">
            <label style="font-size: 13px; font-weight: 600;">Customer Contact / Address</label>
            <input type="text" id="manual-cust-details" class="form-input" placeholder="e.g. John Doe, Sector 15 (+91 99999 11111)">
          </div>

          <div class="settings-group">
            <label style="font-size: 13px; font-weight: 600;">Dish Item Selection</label>
            <select id="manual-item-select" class="form-input">
              ${data.menu.map(m => `<option value="${m.id}">${m.name} ($${m.price})</option>`).join('')}
            </select>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
            <button class="btn btn-secondary modal-close-btn">Cancel</button>
            <button class="btn btn-primary" id="manual-submit-btn">Add Delivery Order</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      const closeModal = () => modal.style.display = 'none';
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));

      content.querySelector('#manual-submit-btn').addEventListener('click', () => {
        const platform = content.querySelector('#manual-platform').value;
        const details = content.querySelector('#manual-cust-details').value.trim();
        const itemId = content.querySelector('#manual-item-select').value;
        
        if (details) {
          const menuItem = data.menu.find(m => m.id === itemId);
          const orderNum = 'MN-' + Math.floor(10000 + Math.random() * 90000);
          
          db.addAggregatorOrder(
            platform, 
            orderNum, 
            [{ name: menuItem.name, price: menuItem.price, quantity: 1, modifications: [] }], 
            details
          );
          closeModal();
          renderFeed();
        } else {
          alert('Please enter customer contact/address details.');
        }
      });
    };

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">Aggregator Orders Feed (Swiggy / Zomato)</h1>
        <button class="btn btn-primary" id="btn-manual-delivery">➕ Manual Delivery Entry</button>
      </div>

      <div class="aggregator-feed">
        <div class="feed-column">
          <div class="column-title">
            <span>Incoming Orders</span>
            <span class="badge" style="background: var(--warning-bg); color: var(--warning-color);" id="badge-incoming">0</span>
          </div>
          <div id="col-incoming" style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1;">
            <!-- Incoming feed -->
          </div>
        </div>

        <div class="feed-column">
          <div class="column-title">
            <span>Preparing</span>
            <span class="badge" style="background: var(--status-occupied-bg); color: var(--status-occupied);" id="badge-preparing">0</span>
          </div>
          <div id="col-preparing" style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1;">
            <!-- Preparing feed -->
          </div>
        </div>

        <div class="feed-column">
          <div class="column-title">
            <span>Out for Delivery</span>
            <span class="badge" style="background: var(--status-free-bg); color: var(--status-free);" id="badge-delivery">0</span>
          </div>
          <div id="col-delivery" style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1;">
            <!-- Delivery feed -->
          </div>
        </div>
      </div>
    `;

    renderFeed();

    // Set badges count
    container.querySelector('#badge-incoming').textContent = data.aggregators.filter(a => a.status === 'incoming').length;
    container.querySelector('#badge-preparing').textContent = data.aggregators.filter(a => a.status === 'preparing').length;
    container.querySelector('#badge-delivery').textContent = data.aggregators.filter(a => a.status === 'out_for_delivery').length;

    container.querySelector('#btn-manual-delivery').addEventListener('click', openManualOrderModal);
  }
};
