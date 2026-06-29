// js/components/sandbox.js
import db from '../db.js';
import orderEntry from './orderEntry.js';
import qrMenu from './qrMenu.js';
import kds from './kds.js';
import billing from './billing.js';

export default {
  render(container, routerNavigate) {
    // Sandbox local states
    let leftPanelType = 'waiter'; // 'waiter' or 'customer'
    let sandboxTableId = 'T3'; // Shared table under test

    const renderSandboxFrames = () => {
      container.innerHTML = `
        <div class="screen-header">
          <div>
            <h1 class="screen-title" style="margin: 0;">Multi-View Operations Sandbox</h1>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
              Place orders, prepare KOTs, and settle billing side-by-side in real-time.
            </p>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center;">
            <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Sandbox Table:</label>
            <select id="sandbox-table-switcher" class="form-input" style="padding: 4px 8px; font-size: 13px; height: 32px;">
              <option value="T1" ${sandboxTableId === 'T1' ? 'selected' : ''}>Table 1 (Free)</option>
              <option value="T3" ${sandboxTableId === 'T3' ? 'selected' : ''}>Table 3 (Occupied)</option>
              <option value="T4" ${sandboxTableId === 'T4' ? 'selected' : ''}>Table 4 (Bill Requested)</option>
            </select>
          </div>
        </div>

        <div class="sandbox-viewports-grid">
          <!-- Panel 1: Waiter / Customer Order -->
          <div class="sandbox-viewport">
            <div class="sandbox-viewport-header">
              <span id="sandbox-left-title">Panel A: Order Placement</span>
              <div>
                <button class="btn btn-secondary ${leftPanelType === 'waiter' ? 'btn-primary' : ''}" id="btn-toggle-sandbox-waiter" style="padding: 3px 8px; font-size: 10px; border-radius: 4px;">
                  Waiter
                </button>
                <button class="btn btn-secondary ${leftPanelType === 'customer' ? 'btn-primary' : ''}" id="btn-toggle-sandbox-customer" style="padding: 3px 8px; font-size: 10px; border-radius: 4px;">
                  Customer QR
                </button>
              </div>
            </div>
            <div class="sandbox-viewport-content" id="sandbox-order-frame">
              <!-- Rendered orderEntry or qrMenu -->
            </div>
          </div>

          <!-- Panel 2: Kitchen Display System -->
          <div class="sandbox-viewport">
            <div class="sandbox-viewport-header">
              <span>Panel B: Kitchen display (KDS)</span>
              <span class="badge" style="background: var(--bg-primary); color: var(--danger-color); font-size: 9px;">Live Queue</span>
            </div>
            <div class="sandbox-viewport-content" id="sandbox-kds-frame">
              <!-- Rendered KDS -->
            </div>
          </div>

          <!-- Panel 3: Cashier Billing Terminal -->
          <div class="sandbox-viewport">
            <div class="sandbox-viewport-header">
              <span>Panel C: Cashier Settle & Split</span>
              <span class="badge" style="background: var(--bg-primary); color: var(--status-free); font-size: 9px;">Billing</span>
            </div>
            <div class="sandbox-viewport-content" id="sandbox-billing-frame">
              <!-- Rendered Billing -->
            </div>
          </div>
        </div>
      `;

      // Render Sub-Components
      const orderFrame = container.querySelector('#sandbox-order-frame');
      const kdsFrame = container.querySelector('#sandbox-kds-frame');
      const billingFrame = container.querySelector('#sandbox-billing-frame');

      // Mock navigation inside sandbox to just refresh sandbox view or change states
      const sandboxNavigateMock = (hash) => {
        // Parse params if any, e.g. #order-entry?tableId=T3
        if (hash.includes('tableId=')) {
          const parts = hash.split('tableId=');
          sandboxTableId = parts[1];
        }
        
        // Re-render
        renderSandboxFrames();
      };

      // 1. Render Left panel
      if (leftPanelType === 'waiter') {
        orderEntry.render(orderFrame, sandboxNavigateMock, 'Captain', sandboxTableId);
      } else {
        qrMenu.render(orderFrame, sandboxNavigateMock, sandboxTableId);
      }

      // 2. Render KDS
      kds.render(kdsFrame);

      // 3. Render Billing
      billing.render(billingFrame, sandboxNavigateMock, sandboxTableId);

      // Bind local sandbox controls
      container.querySelector('#sandbox-table-switcher').addEventListener('change', (e) => {
        sandboxTableId = e.target.value;
        renderSandboxFrames();
      });

      container.querySelector('#btn-toggle-sandbox-waiter').addEventListener('click', () => {
        leftPanelType = 'waiter';
        renderSandboxFrames();
      });

      container.querySelector('#btn-toggle-sandbox-customer').addEventListener('click', () => {
        leftPanelType = 'customer';
        renderSandboxFrames();
      });
    };

    renderSandboxFrames();
  }
};
