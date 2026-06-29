// js/components/orderEntry.js
import db from '../db.js';

export default {
  render(container, routerNavigate, currentRole, tableId = null) {
    const data = db.getData();
    
    // Ensure tableId is valid, default to first table if none provided
    if (!tableId) {
      // Find first occupied or open table
      const activeTable = data.tables.find(t => t.status === 'occupied' || t.status === 'bill_requested') || data.tables[0];
      tableId = activeTable.id;
    }

    const table = data.tables.find(t => t.id === tableId);
    const order = db.getOrCreateOrderForTable(tableId);

    let activeCategory = 'All';
    let searchQuery = '';
    let selectedSeat = 1; // For seat-based ordering allocation

    const renderMenuAndCart = () => {
      // 1. Render Menu Items Grid
      const filteredMenu = data.menu.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      const menuOutlet = container.querySelector('#menu-items-outlet');
      if (menuOutlet) {
        if (filteredMenu.length === 0) {
          menuOutlet.innerHTML = `<div style="grid-column: 1/-1; padding: 30px; text-align: center; color: var(--text-muted);">No menu items found.</div>`;
        } else {
          menuOutlet.innerHTML = filteredMenu.map(item => `
            <div class="menu-item-card ${!item.available ? 'snoozed' : ''}" data-item-id="${item.id}">
              <div class="item-card-header">
                <div class="item-card-name">${item.name}</div>
                <div class="item-card-price">$${item.price.toFixed(2)}</div>
              </div>
              <div class="item-card-desc">${item.description}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span class="badge" style="background: ${item.available ? 'var(--status-free-bg)' : 'var(--danger-bg)'}; color: ${item.available ? 'var(--status-free)' : 'var(--danger-color)'}">
                  ${item.available ? 'Available' : 'Out of Stock'}
                </span>
                ${item.available ? `<button class="btn btn-primary btn-add-item" style="padding: 4px 10px; font-size: 11px;">+ Add</button>` : ''}
              </div>
            </div>
          `).join('');

          // Bind menu card events
          menuOutlet.querySelectorAll('.menu-item-card').forEach(card => {
            const itemId = card.getAttribute('data-item-id');
            const item = data.menu.find(m => m.id === itemId);
            if (!item.available) return;

            card.querySelector('.btn-add-item').addEventListener('click', (e) => {
              e.stopPropagation();
              openModifiersModal(item);
            });
            card.addEventListener('click', () => {
              openModifiersModal(item);
            });
          });
        }
      }

      // 2. Render Cart Items
      const cartOutlet = container.querySelector('#cart-items-outlet');
      if (cartOutlet) {
        if (order.items.length === 0) {
          cartOutlet.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);">Cart is empty. Add menu items to start order.</div>`;
        } else {
          cartOutlet.innerHTML = order.items.map((cartItem, idx) => `
            <div class="cart-item">
              <div class="cart-item-details">
                <div class="cart-item-name">
                  ${cartItem.name} 
                  <span class="badge" style="background: var(--bg-tertiary); text-transform: none; color: var(--text-secondary); font-size: 9px; padding: 1px 4px;">
                    Seat ${cartItem.seatNumber || 1}
                  </span>
                  ${cartItem.sentToKOT ? '✅' : '⏳'}
                </div>
                ${cartItem.modifications.length > 0 ? `
                  <div class="cart-item-mods">+ ${cartItem.modifications.join(', ')}</div>
                ` : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="cart-item-qty-controls">
                  <button class="qty-btn btn-qty-minus" data-idx="${idx}">-</button>
                  <span class="qty-val">${cartItem.quantity}</span>
                  <button class="qty-btn btn-qty-plus" data-idx="${idx}">+</button>
                </div>
                <div class="cart-item-price">
                  $${((cartItem.price) * cartItem.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          `).join('');

          // Bind cart buttons
          cartOutlet.querySelectorAll('.btn-qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
              const idx = parseInt(btn.getAttribute('data-idx'));
              const item = order.items[idx];
              if (item.sentToKOT) {
                // If already sent to kitchen, we require manager/captain authorization to reduce or remove
                openAuthorizationModal('Reduce Item Qty', () => {
                  if (item.quantity > 1) {
                    item.quantity--;
                  } else {
                    order.items.splice(idx, 1);
                  }
                  db.updateOrderItems(order.id, order.items, 'Authorized Edit');
                  renderMenuAndCart();
                });
              } else {
                if (item.quantity > 1) {
                  item.quantity--;
                } else {
                  order.items.splice(idx, 1);
                }
                db.updateOrderItems(order.id, order.items);
                renderMenuAndCart();
              }
            });
          });

          cartOutlet.querySelectorAll('.btn-qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
              const idx = parseInt(btn.getAttribute('data-idx'));
              order.items[idx].quantity++;
              db.updateOrderItems(order.id, order.items);
              renderMenuAndCart();
            });
          });
        }
      }

      // 3. Render Cart summary pricing
      const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      container.querySelector('#summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
      container.querySelector('#summary-tax').textContent = `$${tax.toFixed(2)}`;
      container.querySelector('#summary-total').textContent = `$${total.toFixed(2)}`;

      // Update submit button text based on KOT status
      const unsentItemsCount = order.items.filter(i => !i.sentToKOT).length;
      const submitBtn = container.querySelector('#submit-order-btn');
      if (submitBtn) {
        if (unsentItemsCount > 0) {
          submitBtn.textContent = `🔥 Send ${unsentItemsCount} New Item(s) to Kitchen`;
          submitBtn.disabled = false;
        } else if (order.items.length > 0) {
          submitBtn.textContent = `✅ Order Sent to Kitchen`;
          submitBtn.disabled = true;
        } else {
          submitBtn.textContent = `Submit Order`;
          submitBtn.disabled = true;
        }
      }
    };

    const openModifiersModal = (menuItem) => {
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      const hasMods = menuItem.options && menuItem.options.length > 0;
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>Customize ${menuItem.name}</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 10px;">
          <p style="font-size: 13px; color: var(--text-secondary);">${menuItem.description}</p>
          
          <!-- Seat selector -->
          <div class="settings-group">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Allocate to Seat #</label>
            <div style="display: flex; gap: 8px;">
              ${[1, 2, 3, 4, 5, 6].map(num => `
                <button class="btn seat-num-btn ${num === selectedSeat ? 'btn-primary' : 'btn-secondary'}" data-seat="${num}" style="flex: 1; padding: 6px 0;">
                  Seat ${num}
                </button>
              `).join('')}
            </div>
          </div>

          ${hasMods ? `
            <div>
              <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 8px;">
                Modifiers & Add-ons
              </label>
              <div class="modifier-options-list">
                ${menuItem.options.map((opt, i) => `
                  <div class="modifier-option" data-idx="${i}">
                    <div class="option-label">
                      <input type="checkbox" id="mod-chk-${i}" style="pointer-events: none;">
                      <span>${opt.name}</span>
                    </div>
                    <strong>+$${opt.price.toFixed(2)}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<p style="font-size: 12px; color: var(--text-muted);">No custom options available for this dish.</p>'}

          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
            <button class="btn btn-secondary modal-close-btn">Cancel</button>
            <button class="btn btn-primary" id="add-to-cart-submit">Add to Order</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      // Seat selection listeners
      const seatBtns = content.querySelectorAll('.seat-num-btn');
      seatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          seatBtns.forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); });
          btn.classList.add('btn-primary');
          btn.classList.remove('btn-secondary');
          selectedSeat = parseInt(btn.getAttribute('data-seat'));
        });
      });

      // Mod checkbox toggle
      const modItems = content.querySelectorAll('.modifier-option');
      modItems.forEach(item => {
        item.addEventListener('click', () => {
          const chk = item.querySelector('input[type="checkbox"]');
          chk.checked = !chk.checked;
          item.classList.toggle('selected', chk.checked);
        });
      });

      const closeModal = () => modal.style.display = 'none';
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));

      content.querySelector('#add-to-cart-submit').addEventListener('click', () => {
        // Collect checked modifications
        const chosenMods = [];
        let priceBump = 0;
        
        if (hasMods) {
          modItems.forEach(item => {
            const chk = item.querySelector('input[type="checkbox"]');
            if (chk.checked) {
              const optIndex = parseInt(item.getAttribute('data-idx'));
              const option = menuItem.options[optIndex];
              chosenMods.push(option.name);
              priceBump += option.price;
            }
          });
        }

        // Check if item with same mods and seat exists
        const existingCartItem = order.items.find(i => 
          i.id === menuItem.id && 
          i.seatNumber === selectedSeat &&
          !i.sentToKOT &&
          JSON.stringify(i.modifications) === JSON.stringify(chosenMods)
        );

        if (existingCartItem) {
          existingCartItem.quantity++;
        } else {
          order.items.push({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price + priceBump,
            quantity: 1,
            modifications: chosenMods,
            sentToKOT: false,
            seatNumber: selectedSeat
          });
        }

        db.updateOrderItems(order.id, order.items);
        closeModal();
        renderMenuAndCart();
      });
    };

    // Manager / Captain approval modal
    const openAuthorizationModal = (title, onSuccess) => {
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>Approval Needed: ${title}</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 10px;">
          <p style="font-size: 13px; color: var(--text-secondary);">
            Removing items already sent to the kitchen requires supervisor credentials.
          </p>
          
          <div class="settings-group">
            <label style="font-size: 12px; font-weight: 600;">Authorized Staff Pin / Name</label>
            <select id="auth-staff-name" class="form-input">
              <option value="Sarah (Manager)">Sarah (Manager)</option>
              <option value="David (Owner)">David (Owner)</option>
            </select>
          </div>
          
          <div class="settings-group">
            <label style="font-size: 12px; font-weight: 600;">Reason for Deletion / Change</label>
            <input type="text" id="auth-reason" class="form-input" placeholder="e.g. Customer changed mind / Prep error">
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
            <button class="btn btn-secondary modal-close-btn">Cancel</button>
            <button class="btn btn-danger" id="auth-submit-btn">Authorize Change</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      const closeModal = () => modal.style.display = 'none';
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));

      content.querySelector('#auth-submit-btn').addEventListener('click', () => {
        const staff = content.querySelector('#auth-staff-name').value;
        const reason = content.querySelector('#auth-reason').value.trim();
        
        if (reason) {
          closeModal();
          db.addLog(staff, `Authorized KOT item modification: "${reason}"`);
          onSuccess();
        } else {
          alert('Please enter a reason for authorization.');
        }
      });
    };

    const openCancelOrderModal = () => {
      openAuthorizationModal('Cancel Complete Order', () => {
        const reasonInput = prompt('Enter final reason for order cancellation:');
        if (reasonInput) {
          db.cancelOrder(order.id, reasonInput, 'Manager Sarah');
          routerNavigate('#tables');
        }
      });
    };

    container.innerHTML = `
      <div class="screen-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <h1 class="screen-title" style="margin: 0;">Table ${table ? table.number : 'Dine-In'}</h1>
          <span class="badge" style="background: var(--accent-glow); color: var(--accent-color); font-size: 12px;">
            Assigned Waiter: ${table ? table.assignedStaff : 'Bob'}
          </span>
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Table Quick Switch:</label>
          <select id="order-table-switcher" class="form-input" style="padding: 6px 12px; font-size: 13px; height: 36px;">
            ${data.tables.map(t => `<option value="${t.id}" ${t.id === tableId ? 'selected' : ''}>Table ${t.number} (${t.status})</option>`).join('')}
          </select>
          <button class="btn btn-secondary" id="btn-cancel-entire-order" style="border: 1px solid var(--danger-color); color: var(--danger-color);">
            🗑️ Void Order
          </button>
        </div>
      </div>

      <div class="order-entry-layout">
        <!-- Catalog of Dishes -->
        <div class="menu-catalog">
          <div class="menu-search-bar">
            <input type="text" id="menu-search-box" class="menu-search-input" placeholder="🔍 Search menu item name or description...">
          </div>

          <div class="category-tabs" id="menu-category-tabs">
            <button class="category-tab active" data-cat="All">All Menu</button>
            <button class="category-tab" data-cat="Starters">Starters</button>
            <button class="category-tab" data-cat="Mains">Mains</button>
            <button class="category-tab" data-cat="Desserts">Desserts</button>
            <button class="category-tab" data-cat="Beverages">Beverages</button>
          </div>

          <div class="menu-items-grid" id="menu-items-outlet">
            <!-- Dynamically Loaded Menu cards -->
          </div>
        </div>

        <!-- Right Side Shopping Cart -->
        <div class="order-cart-panel">
          <div class="cart-header">
            <h3>Active KOT Queue</h3>
            <span class="badge" style="background: var(--bg-tertiary); color: var(--text-primary); font-size: 12px;">
              ${order.items.length} Lines
            </span>
          </div>

          <div class="cart-items-list" id="cart-items-outlet">
            <!-- Cart Items -->
          </div>

          <!-- Customer notes & allergies warnings -->
          <div class="cart-notes-section">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              Kitchen Notes / Allergy Warnings
            </label>
            <textarea id="cart-notes-box" class="cart-notes-input" rows="2" placeholder="e.g. No peanuts, extra sauce on side...">${order.notes || ''}</textarea>
          </div>

          <!-- Cart Pricing Summary -->
          <div class="cart-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span id="summary-subtotal">$0.00</span>
            </div>
            <div class="summary-row">
              <span>Taxes (GST 5%)</span>
              <span id="summary-tax">$0.00</span>
            </div>
            <div class="summary-row total">
              <span>Estimated Total</span>
              <strong id="summary-total">$0.00</strong>
            </div>
          </div>

          <!-- Send Order / KOT dispatch -->
          <div style="margin-top: 15px; display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="btn-back-to-tables" style="flex: 1;">Floor Map</button>
            <button class="btn btn-primary" id="submit-order-btn" style="flex: 2; padding: 12px 10px;">
              Submit to Kitchen
            </button>
          </div>
        </div>
      </div>
    `;

    renderMenuAndCart();

    // 1. Table switcher listener
    container.querySelector('#order-table-switcher').addEventListener('change', (e) => {
      const newTableId = e.target.value;
      routerNavigate(`#order-entry?tableId=${newTableId}`);
    });

    // 2. Void order listener
    container.querySelector('#btn-cancel-entire-order').addEventListener('click', openCancelOrderModal);

    // 3. Category tabs listeners
    container.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.getAttribute('data-cat');
        renderMenuAndCart();
      });
    });

    // 4. Search bar listener
    container.querySelector('#menu-search-box').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderMenuAndCart();
    });

    // 5. Notes text box listener
    container.querySelector('#cart-notes-box').addEventListener('input', (e) => {
      order.notes = e.target.value;
      db.saveOrder(order);
    });

    // 6. Back button
    container.querySelector('#btn-back-to-tables').addEventListener('click', () => {
      routerNavigate('#tables');
    });

    // 7. Submit KOT button listener
    container.querySelector('#submit-order-btn').addEventListener('click', () => {
      db.sendToKitchen(order.id, 'medium', currentRole);
      // Play a quick chime to simulate thermal print triggering
      if (window.playNotificationSound) {
        window.playNotificationSound(660, 0.1);
        setTimeout(() => window.playNotificationSound(880, 0.15), 100);
      }
      alert('Kitchen Order Ticket (KOT) sent successfully to printer and KDS!');
      routerNavigate('#tables');
    });
  }
};
