// js/components/billing.js
import db, { TAX_RATE, SERVICE_CHARGE_RATE } from '../db.js';

export default {
  render(container, routerNavigate, tableId = null) {
    const data = db.getData();
    
    // Ensure tableId is valid, default to first occupied or open table
    if (!tableId) {
      const activeTable = data.tables.find(t => t.status === 'occupied' || t.status === 'bill_requested') || data.tables[0];
      tableId = activeTable.id;
    }

    const table = data.tables.find(t => t.id === tableId);
    const order = data.orders.find(o => o.tableId === tableId && o.status !== 'settled');

    // Split Billing states
    let activeSplitTab = 'full'; // 'full', 'person', 'item', 'custom'
    let discountPercent = 0;
    let tipAmount = 0;
    let serviceChargeEnabled = true;

    // Person split counts
    let splitCount = 2;
    // Custom split input amount
    let customSplitAmount = 10;
    // Item split: tracking paid items/seats
    let selectedItemsForSplit = [];

    const calculateTotals = (overrideItems = null) => {
      const itemsToCalc = overrideItems || (order ? order.items : []);
      const subtotal = itemsToCalc.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = subtotal * (discountPercent / 100);
      const subtotalAfterDiscount = subtotal - discount;
      const tax = subtotalAfterDiscount * TAX_RATE;
      const service = serviceChargeEnabled ? (subtotalAfterDiscount * SERVICE_CHARGE_RATE) : 0;
      const total = subtotalAfterDiscount + tax + service + parseFloat(tipAmount || 0);

      return { subtotal, discount, tax, service, total };
    };

    const renderBillingViews = () => {
      if (!order || order.items.length === 0) {
        container.querySelector('#billing-outlet').innerHTML = `
          <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">
            <h2>No active order found for Table ${table ? table.number : 'Dine-In'}.</h2>
            <p style="margin-top: 10px;">Select another table from the list or open a table first.</p>
          </div>
        `;
        return;
      }

      const totals = calculateTotals();

      // Render Split Tab Contents
      const splitTabOutlet = container.querySelector('#split-tab-content-outlet');
      if (splitTabOutlet) {
        if (activeSplitTab === 'full') {
          splitTabOutlet.innerHTML = `
            <div style="padding: 10px 0; display: flex; flex-direction: column; gap: 15px;">
              <p style="font-size: 14px; color: var(--text-secondary);">
                Settling the complete bill value in a single payment transaction.
              </p>
              
              <div class="card" style="background: var(--bg-primary);">
                <div class="receipt-row" style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                  <span>Invoice Amount Due</span>
                  <span style="color: var(--accent-color);">$${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;
        }

        else if (activeSplitTab === 'person') {
          const perPerson = totals.total / splitCount;
          splitTabOutlet.innerHTML = `
            <div style="padding: 10px 0; display: flex; flex-direction: column; gap: 15px;">
              <div class="settings-group">
                <label style="font-size: 13px; font-weight: 600;">Divide Bill Equally by (No. of people)</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <button class="btn btn-secondary" id="btn-split-people-minus" style="padding: 6px 12px;">-</button>
                  <strong style="font-size: 16px; min-width: 40px; text-align: center;" id="lbl-split-people-val">${splitCount}</strong>
                  <button class="btn btn-secondary" id="btn-split-people-plus" style="padding: 6px 12px;">+</button>
                </div>
              </div>
              
              <div class="card" style="background: var(--bg-primary);">
                <div class="receipt-row" style="font-size: 14px; margin-bottom: 6px;">
                  <span>Grand Total</span>
                  <span>$${totals.total.toFixed(2)}</span>
                </div>
                <div class="receipt-row" style="font-size: 16px; font-weight: bold; border-top: 1px dashed var(--bg-tertiary); padding-top: 8px;">
                  <span>Share Per Person (${splitCount} ways)</span>
                  <span style="color: var(--status-reserved);">$${perPerson.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;

          // Event listeners
          splitTabOutlet.querySelector('#btn-split-people-minus').addEventListener('click', () => {
            if (splitCount > 2) { splitCount--; renderBillingViews(); }
          });
          splitTabOutlet.querySelector('#btn-split-people-plus').addEventListener('click', () => {
            splitCount++; renderBillingViews();
          });
        }

        else if (activeSplitTab === 'item') {
          // Group items by seat numbers
          const seatGroup = {};
          order.items.forEach(item => {
            const seatNum = item.seatNumber || 1;
            if (!seatGroup[seatNum]) seatGroup[seatNum] = [];
            seatGroup[seatNum].push(item);
          });

          splitTabOutlet.innerHTML = `
            <div style="padding: 10px 0; display: flex; flex-direction: column; gap: 15px;">
              <p style="font-size: 13px; color: var(--text-secondary);">
                Select seat number to settle items allocated to that specific customer.
              </p>
              
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${Object.keys(seatGroup).map(seat => {
                  const seatItems = seatGroup[seat];
                  const seatTotals = calculateTotals(seatItems);
                  
                  return `
                    <div class="split-group-card" style="display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--accent-color);">
                      <div>
                        <strong>Seat ${seat} Share</strong>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                          ${seatItems.map(si => `${si.quantity}x ${si.name}`).join(', ')}
                        </div>
                      </div>
                      <div style="text-align: right; display: flex; align-items: center; gap: 12px;">
                        <span style="font-weight: 700; color: var(--text-primary);">$${seatTotals.total.toFixed(2)}</span>
                        <button class="btn btn-primary btn-pay-seat" data-seat="${seat}" style="padding: 4px 10px; font-size: 11px;">
                          Settle Seat
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;

          // Pay seat listener
          splitTabOutlet.querySelectorAll('.btn-pay-seat').forEach(btn => {
            btn.addEventListener('click', () => {
              const seat = btn.getAttribute('data-seat');
              const seatItems = seatGroup[seat];
              const seatTotals = calculateTotals(seatItems);
              
              // Settle this seat's items
              const pm = container.querySelector('#payment-method-selector').value;
              
              // Settle subset of order
              db.settleOrder(order.id, {
                subtotal: seatTotals.subtotal,
                tax: seatTotals.tax,
                serviceCharge: seatTotals.service,
                discount: seatTotals.discount,
                tip: 0,
                total: seatTotals.total,
                method: `${pm} (Seat ${seat} Split)`
              });
              
              // Remove these items from the active order
              const remainingItems = order.items.filter(i => (i.seatNumber || 1) !== parseInt(seat));
              if (remainingItems.length === 0) {
                // All items settled, table is clear
                routerNavigate('#tables');
              } else {
                order.items = remainingItems;
                db.saveOrder(order);
                alert(`Seat ${seat} payment settled! Remaining seats are still open.`);
                renderBillingViews();
              }
            });
          });
        }

        else if (activeSplitTab === 'custom') {
          splitTabOutlet.innerHTML = `
            <div style="padding: 10px 0; display: flex; flex-direction: column; gap: 15px;">
              <div class="settings-group">
                <label style="font-size: 13px; font-weight: 600;">Custom Payment Amount ($)</label>
                <input type="number" id="custom-split-val" class="form-input" value="${customSplitAmount}" min="1" max="${totals.total.toFixed(2)}">
              </div>
              
              <div class="card" style="background: var(--bg-primary);">
                <div class="receipt-row" style="font-size: 14px; margin-bottom: 6px;">
                  <span>Grand Total Remaining</span>
                  <span>$${totals.total.toFixed(2)}</span>
                </div>
                <div class="receipt-row" style="font-size: 16px; font-weight: bold; border-top: 1px dashed var(--bg-tertiary); padding-top: 8px;">
                  <span>Settle Portion Amount</span>
                  <span style="color: var(--status-cleaning);">$${parseFloat(customSplitAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;

          // Input listener
          splitTabOutlet.querySelector('#custom-split-val').addEventListener('input', (e) => {
            customSplitAmount = e.target.value;
          });
        }
      }

      // Update Thermal Receipt Preview Panel
      const receiptOutlet = container.querySelector('#receipt-preview-outlet');
      if (receiptOutlet) {
        receiptOutlet.innerHTML = `
          <div class="thermal-receipt-preview">
            <div class="receipt-header">
              <span class="receipt-logo">ZESTCAFE DINE-IN</span>
              <span>Table ${table.number} • Waiter: ${table.assignedStaff || 'Bob'}</span>
              <span>Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>Order ID: ${order.id.substring(0, 10)}...</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <table class="receipt-items-table">
              <thead>
                <tr style="text-align: left; font-size: 11px;">
                  <th>Item Description</th>
                  <th style="text-align: right;">Qty</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr style="font-size: 12px;">
                    <td>${item.name} <br> <small style="color: #666;">Seat ${item.seatNumber || 1}</small></td>
                    <td style="text-align: right;">${item.quantity}</td>
                    <td style="text-align: right;">$${((item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-totals" style="font-size: 12px;">
              <div class="receipt-row">
                <span>Subtotal:</span>
                <span>$${totals.subtotal.toFixed(2)}</span>
              </div>
              ${totals.discount > 0 ? `
                <div class="receipt-row" style="color: #c00;">
                  <span>Promo Discount (${discountPercent}%):</span>
                  <span>-$${totals.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="receipt-row">
                <span>GST (5%):</span>
                <span>$${totals.tax.toFixed(2)}</span>
              </div>
              ${totals.service > 0 ? `
                <div class="receipt-row">
                  <span>Service Charge (10%):</span>
                  <span>$${totals.service.toFixed(2)}</span>
                </div>
              ` : ''}
              ${tipAmount > 0 ? `
                <div class="receipt-row">
                  <span>Staff Tip:</span>
                  <span>$${parseFloat(tipAmount).toFixed(2)}</span>
                </div>
              ` : ''}
              
              <div class="receipt-divider"></div>
              
              <div class="receipt-row" style="font-size: 15px; font-weight: bold;">
                <span>Total Amount Due:</span>
                <span>$${totals.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="receipt-divider" style="margin-top: 15px;"></div>
            <div style="text-align: center; font-size: 11px; margin-top: 10px;">
              Thank You for Dining with Us!<br>
              ZestOps POS Management Terminal
            </div>
          </div>
        `;
      }
    };

    container.innerHTML = `
      <div class="screen-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <h1 class="screen-title" style="margin: 0;">Table Checkout / Invoice</h1>
          <span class="badge" style="background: var(--status-bill-requested-bg); color: var(--status-bill-requested); font-size: 12px;">
            Floor Status: ${table ? table.status.toUpperCase() : ''}
          </span>
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Select Table:</label>
          <select id="billing-table-switcher" class="form-input" style="padding: 6px 12px; font-size: 13px; height: 36px;">
            ${data.tables.map(t => `<option value="${t.id}" ${t.id === tableId ? 'selected' : ''}>Table ${t.number} (${t.status})</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="billing-layout" id="billing-outlet">
        <!-- Split controls & Payment settings -->
        <div class="billing-split-container">
          <div class="card">
            <h3>Split Bill Settings</h3>
            <div class="split-tabs" style="margin-top: 12px;">
              <button class="split-tab active" data-split="full">Full Bill</button>
              <button class="split-tab" data-split="person">Person-wise</button>
              <button class="split-tab" data-split="item">Item-wise (Seats)</button>
              <button class="split-tab" data-split="custom">Custom amount</button>
            </div>

            <div id="split-tab-content-outlet" style="margin-top: 15px; border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 15px;">
              <!-- Split parameters -->
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="settings-group">
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Discount %</label>
                  <select id="bill-discount-select" class="form-input">
                    <option value="0">None (0%)</option>
                    <option value="5">Staff Discount (5%)</option>
                    <option value="10">Happy Hour (10%)</option>
                    <option value="15">Promo Coupon (15%)</option>
                    <option value="20">Manager Special (20%)</option>
                  </select>
                </div>
                
                <div class="settings-group">
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Staff Tips ($)</label>
                  <input type="number" id="bill-tips-input" class="form-input" value="0" min="0" placeholder="Tips amount">
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                <input type="checkbox" id="bill-service-charge-chk" checked>
                <label for="bill-service-charge-chk" style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">
                  Apply In-house Service Charge (10%)
                </label>
              </div>

              <div class="settings-group" style="margin-top: 10px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Payment Gateway / Method</label>
                <select id="payment-method-selector" class="form-input">
                  <option value="UPI">UPI / Digital QR</option>
                  <option value="Card">Visa / MasterCard</option>
                  <option value="Cash">Cash Drawer</option>
                  <option value="Mixed (Cash + UPI)">Mixed (Cash + UPI)</option>
                  <option value="Mixed (Cash + Card)">Mixed (Cash + Card)</option>
                </select>
              </div>

              <button class="btn btn-success" id="btn-settle-complete-invoice" style="padding: 12px; font-size: 15px; margin-top: 10px; font-weight: 700;">
                💳 Complete Payment Settle
              </button>
            </div>
          </div>
        </div>

        <!-- Receipt Simulator preview -->
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <div id="receipt-preview-outlet">
            <!-- Thermal style invoice -->
          </div>
          <button class="btn btn-secondary" id="btn-print-bill-thermal">🖨️ Print Receipt Preview</button>
        </div>
      </div>
    `;

    renderBillingViews();

    // Event listeners
    // 1. Table switcher
    container.querySelector('#billing-table-switcher').addEventListener('change', (e) => {
      const newTableId = e.target.value;
      routerNavigate(`#billing?tableId=${newTableId}`);
    });

    // 2. Split tabs switcher
    container.querySelectorAll('.split-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.split-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeSplitTab = tab.getAttribute('data-split');
        renderBillingViews();
      });
    });

    // 3. Discount select listener
    container.querySelector('#bill-discount-select').addEventListener('change', (e) => {
      discountPercent = parseInt(e.target.value);
      renderBillingViews();
    });

    // 4. Tips listener
    container.querySelector('#bill-tips-input').addEventListener('input', (e) => {
      tipAmount = e.target.value;
      renderBillingViews();
    });

    // 5. Service charge checkbox
    container.querySelector('#bill-service-charge-chk').addEventListener('change', (e) => {
      serviceChargeEnabled = e.target.checked;
      renderBillingViews();
    });

    // 6. Print bill
    container.querySelector('#btn-print-bill-thermal').addEventListener('click', () => {
      window.print();
    });

    // 7. Complete Settle Invoice
    container.querySelector('#btn-settle-complete-invoice').addEventListener('click', () => {
      const totals = calculateTotals();
      const pm = container.querySelector('#payment-method-selector').value;

      if (activeSplitTab === 'custom') {
        const customVal = parseFloat(customSplitAmount || 0);
        if (customVal <= 0 || customVal > totals.total) {
          alert('Invalid custom split amount.');
          return;
        }
        
        // Settle a portion of the bill
        db.settleOrder(order.id, {
          subtotal: totals.subtotal * (customVal / totals.total),
          tax: totals.tax * (customVal / totals.total),
          serviceCharge: totals.service * (customVal / totals.total),
          discount: totals.discount * (customVal / totals.total),
          tip: 0,
          total: customVal,
          method: `${pm} (Custom Split)`
        });

        // Reduce values for the active order items by scaling or adjusting cart
        // Simply reduce subtotal in order or mark remaining
        // In this implementation, custom amount reduces the order subtotal
        alert(`Settled partial payment of $${customVal.toFixed(2)}. Remaining balance is still open.`);
        
        // Simple mock of remaining balance
        const remaining = totals.total - customVal;
        if (remaining <= 0.1) {
          routerNavigate('#tables');
        } else {
          // Adjust order items to simulate remaining balance or navigate to tables
          routerNavigate('#tables');
        }
      }

      else if (activeSplitTab === 'person') {
        const perPerson = totals.total / splitCount;
        alert(`Settled payment share 1 of ${splitCount}: $${perPerson.toFixed(2)} via ${pm}. Remaining portions will be billed separately.`);
        
        db.settleOrder(order.id, {
          subtotal: totals.subtotal / splitCount,
          tax: totals.tax / splitCount,
          serviceCharge: totals.service / splitCount,
          discount: totals.discount / splitCount,
          tip: parseFloat(tipAmount || 0) / splitCount,
          total: perPerson,
          method: `${pm} (1/${splitCount} Split)`
        });

        // If splitCount reduces to 1, we can complete
        splitCount--;
        if (splitCount <= 0) {
          routerNavigate('#tables');
        } else {
          renderBillingViews();
        }
      }

      else {
        // Full settle
        db.settleOrder(order.id, {
          subtotal: totals.subtotal,
          tax: totals.tax,
          serviceCharge: totals.service,
          discount: totals.discount,
          tip: parseFloat(tipAmount || 0),
          total: totals.total,
          method: pm
        });
        
        if (window.playNotificationSound) {
          window.playNotificationSound(880, 0.15, 'sine');
          setTimeout(() => window.playNotificationSound(1320, 0.25), 100);
        }

        alert(`Table ${table.number} invoice settled completely! Total paid: $${totals.total.toFixed(2)} via ${pm}`);
        routerNavigate('#tables');
      }
    });
  }
};
