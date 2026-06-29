// js/components/sandbox.js
import db from '../db.js';
import orderEntry from './orderEntry.js';
import qrMenu from './qrMenu.js';
import kds from './kds.js';
import billing from './billing.js';

// Local persistent states for sandbox session
let layoutMode = 'grid'; // 'grid' (3 Cols), 'split' (2 Cols), 'focus' (1 Col)
let activePanelLeft = 'ordering'; // 'ordering', 'kds', 'billing'
let activePanelRight = 'kds'; // 'ordering', 'kds', 'billing'
let activePanelFocus = 'ordering'; // 'ordering', 'kds', 'billing'
let leftPanelType = 'waiter'; // 'waiter' or 'customer'
let sandboxTableId = 'T3'; // Shared table under test
let isSidebarCollapsed = false;
let isFullscreen = false;

export default {
  render(container, routerNavigate) {
    const data = db.getData();

    const renderSandboxFrames = () => {
      // Sync global application layout states
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.classList.toggle('sidebar-collapsed', isSidebarCollapsed);
        appEl.classList.toggle('fullscreen-sandbox', isFullscreen);
      }

      // Generate grid class
      let gridClass = 'sandbox-viewports-grid';
      if (layoutMode === 'split') gridClass += ' layout-split';
      if (layoutMode === 'focus') gridClass += ' layout-focus';

      // HTML template build
      container.innerHTML = `
        <!-- Floating Exit Fullscreen Button -->
        ${isFullscreen ? `
          <button class="btn btn-danger" id="btn-exit-fullscreen-float" style="position: fixed; top: 12px; right: 12px; z-index: 10000; box-shadow: var(--shadow-lg); font-size: 12px; padding: 6px 12px;">
            ✕ Exit Fullscreen Mode
          </button>
        ` : ''}

        <div class="screen-header" style="flex-wrap: wrap; gap: 15px;">
          <div>
            <h1 class="screen-title" style="margin: 0;">Multi-View Operations Sandbox</h1>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
              Place orders, prepare KOTs, and settle billing side-by-side in real-time.
            </p>
          </div>
          
          <!-- Sandbox Controls Bar -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-left: auto;">
            <!-- Table selector -->
            <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-secondary); border: 1px solid var(--bg-tertiary); padding: 4px 8px; border-radius: var(--radius-sm);">
              <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Table:</span>
              <select id="sandbox-table-switcher" class="form-input" style="padding: 2px 4px; font-size: 11px; height: 26px; border: none; background: none;">
                <option value="T1" ${sandboxTableId === 'T1' ? 'selected' : ''}>Table 1 (Free)</option>
                <option value="T3" ${sandboxTableId === 'T3' ? 'selected' : ''}>Table 3 (Occupied)</option>
                <option value="T4" ${sandboxTableId === 'T4' ? 'selected' : ''}>Table 4 (Bill Asked)</option>
              </select>
            </div>

            <!-- Layout selector -->
            <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-secondary); border: 1px solid var(--bg-tertiary); padding: 4px 8px; border-radius: var(--radius-sm);">
              <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Layout:</span>
              <select id="sandbox-layout-mode" class="form-input" style="padding: 2px 4px; font-size: 11px; height: 26px; border: none; background: none;">
                <option value="grid" ${layoutMode === 'grid' ? 'selected' : ''}>3 Columns (Wide)</option>
                <option value="split" ${layoutMode === 'split' ? 'selected' : ''}>Split Screen (2 Columns)</option>
                <option value="focus" ${layoutMode === 'focus' ? 'selected' : ''}>Focus View (1 Column)</option>
              </select>
            </div>

            <!-- Sidebar Collapse toggle -->
            <button class="btn btn-secondary" id="btn-toggle-sandbox-sidebar" style="padding: 6px 12px; font-size: 12px; height: 32px;" title="Collapse app navigation sidebar for more spacing">
              ${isSidebarCollapsed ? '📂 Show Sidebar' : '📁 Collapse Sidebar'}
            </button>

            <!-- Fullscreen toggle -->
            <button class="btn btn-primary" id="btn-toggle-sandbox-fullscreen" style="padding: 6px 12px; font-size: 12px; height: 32px;">
              ${isFullscreen ? '🗖 Windowed' : '🖥️ Fullscreen Sandbox'}
            </button>
          </div>
        </div>

        <!-- Render active viewport config panel if not in standard grid mode -->
        ${layoutMode !== 'grid' ? `
          <div class="card" style="padding: 10px 15px; display: flex; gap: 15px; align-items: center; background: var(--bg-secondary); border-color: var(--bg-tertiary); font-size: 13px;">
            <strong style="color: var(--accent-color);">Configure Panels:</strong>
            
            ${layoutMode === 'split' ? `
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>Left Panel Content:</span>
                <select id="select-panel-left" class="form-input" style="padding: 2px 6px; font-size: 12px; height: 26px;">
                  <option value="ordering" ${activePanelLeft === 'ordering' ? 'selected' : ''}>Order Placement (A)</option>
                  <option value="kds" ${activePanelLeft === 'kds' ? 'selected' : ''}>Kitchen KDS (B)</option>
                  <option value="billing" ${activePanelLeft === 'billing' ? 'selected' : ''}>Cashier Billing (C)</option>
                </select>
              </div>

              <div style="display: flex; align-items: center; gap: 6px; margin-left: 10px;">
                <span>Right Panel Content:</span>
                <select id="select-panel-right" class="form-input" style="padding: 2px 6px; font-size: 12px; height: 26px;">
                  <option value="ordering" ${activePanelRight === 'ordering' ? 'selected' : ''}>Order Placement (A)</option>
                  <option value="kds" ${activePanelRight === 'kds' ? 'selected' : ''}>Kitchen KDS (B)</option>
                  <option value="billing" ${activePanelRight === 'billing' ? 'selected' : ''}>Cashier Billing (C)</option>
                </select>
              </div>
            ` : `
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>Select Focused View:</span>
                <select id="select-panel-focus" class="form-input" style="padding: 2px 6px; font-size: 12px; height: 26px;">
                  <option value="ordering" ${activePanelFocus === 'ordering' ? 'selected' : ''}>Order Placement (A)</option>
                  <option value="kds" ${activePanelFocus === 'kds' ? 'selected' : ''}>Kitchen KDS (B)</option>
                  <option value="billing" ${activePanelFocus === 'billing' ? 'selected' : ''}>Cashier Billing (C)</option>
                </select>
              </div>
            `}
          </div>
        ` : ''}

        <!-- Viewports Container Grid -->
        <div class="${gridClass}" id="sandbox-viewports-outlet">
          <!-- Viewports will be injected dynamically -->
        </div>
      `;

      // Helper function to build Panel A (Order Placement) structure
      const buildOrderingPanelHtml = () => `
        <div class="sandbox-viewport">
          <div class="sandbox-viewport-header">
            <span style="font-weight: 700;">Panel A: Order Placement</span>
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
            <!-- Injected by orderEntry or qrMenu -->
          </div>
        </div>
      `;

      // Helper function to build Panel B (Kitchen KDS) structure
      const buildKdsPanelHtml = () => `
        <div class="sandbox-viewport">
          <div class="sandbox-viewport-header">
            <span style="font-weight: 700;">Panel B: Kitchen display (KDS)</span>
            <span class="badge" style="background: var(--bg-primary); color: var(--danger-color); font-size: 9px;">Live Queue</span>
          </div>
          <div class="sandbox-viewport-content" id="sandbox-kds-frame" style="padding: 10px;">
            <!-- Injected by kds -->
          </div>
        </div>
      `;

      // Helper function to build Panel C (Cashier Billing) structure
      const buildBillingPanelHtml = () => `
        <div class="sandbox-viewport">
          <div class="sandbox-viewport-header">
            <span style="font-weight: 700;">Panel C: Cashier Settle & Split</span>
            <span class="badge" style="background: var(--bg-primary); color: var(--status-free); font-size: 9px;">Billing</span>
          </div>
          <div class="sandbox-viewport-content" id="sandbox-billing-frame" style="padding: 10px;">
            <!-- Injected by billing -->
          </div>
        </div>
      `;

      const viewportsOutlet = container.querySelector('#sandbox-viewports-outlet');
      if (!viewportsOutlet) return;

      // 2. Populate columns based on Layout Mode
      if (layoutMode === 'grid') {
        viewportsOutlet.innerHTML = buildOrderingPanelHtml() + buildKdsPanelHtml() + buildBillingPanelHtml();
      }

      else if (layoutMode === 'split') {
        let leftHtml = '';
        let rightHtml = '';
        
        if (activePanelLeft === 'ordering') leftHtml = buildOrderingPanelHtml();
        else if (activePanelLeft === 'kds') leftHtml = buildKdsPanelHtml();
        else if (activePanelLeft === 'billing') leftHtml = buildBillingPanelHtml();

        if (activePanelRight === 'ordering') rightHtml = buildOrderingPanelHtml();
        else if (activePanelRight === 'kds') rightHtml = buildKdsPanelHtml();
        else if (activePanelRight === 'billing') rightHtml = buildBillingPanelHtml();

        viewportsOutlet.innerHTML = leftHtml + rightHtml;
      }

      else if (layoutMode === 'focus') {
        let focusHtml = '';
        
        if (activePanelFocus === 'ordering') focusHtml = buildOrderingPanelHtml();
        else if (activePanelFocus === 'kds') focusHtml = buildKdsPanelHtml();
        else if (activePanelFocus === 'billing') focusHtml = buildBillingPanelHtml();

        viewportsOutlet.innerHTML = focusHtml;
      }

      // 3. Render Inner Modules on their frames
      const sandboxNavigateMock = (hash) => {
        if (hash.includes('tableId=')) {
          const parts = hash.split('tableId=');
          sandboxTableId = parts[1];
        }
        renderSandboxFrames();
      };

      // Order placement frame loader
      const orderFrame = container.querySelector('#sandbox-order-frame');
      if (orderFrame) {
        if (leftPanelType === 'waiter') {
          orderEntry.render(orderFrame, sandboxNavigateMock, 'Captain', sandboxTableId);
        } else {
          qrMenu.render(orderFrame, sandboxNavigateMock, sandboxTableId);
        }
      }

      // KDS frame loader
      const kdsFrame = container.querySelector('#sandbox-kds-frame');
      if (kdsFrame) {
        kds.render(kdsFrame);
      }

      // Billing frame loader
      const billingFrame = container.querySelector('#sandbox-billing-frame');
      if (billingFrame) {
        billing.render(billingFrame, sandboxNavigateMock, sandboxTableId);
      }

      // 4. Attach Event Listeners
      
      // Table switch
      container.querySelector('#sandbox-table-switcher').addEventListener('change', (e) => {
        sandboxTableId = e.target.value;
        renderSandboxFrames();
      });

      // Layout Switch
      container.querySelector('#sandbox-layout-mode').addEventListener('change', (e) => {
        layoutMode = e.target.value;
        renderSandboxFrames();
      });

      // Toggle Sidebar
      container.querySelector('#btn-toggle-sandbox-sidebar').addEventListener('click', () => {
        isSidebarCollapsed = !isSidebarCollapsed;
        renderSandboxFrames();
      });

      // Toggle Fullscreen
      container.querySelector('#btn-toggle-sandbox-fullscreen').addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        // Collapsing sidebar usually goes hand-in-hand with fullscreen
        isSidebarCollapsed = isFullscreen;
        renderSandboxFrames();
      });

      // Exit Fullscreen floating button
      const exitFloat = container.querySelector('#btn-exit-fullscreen-float');
      if (exitFloat) {
        exitFloat.addEventListener('click', () => {
          isFullscreen = false;
          isSidebarCollapsed = false;
          renderSandboxFrames();
        });
      }

      // Left toggle buttons (Waiter vs QR Customer)
      const btnWaiter = container.querySelector('#btn-toggle-sandbox-waiter');
      const btnCustomer = container.querySelector('#btn-toggle-sandbox-customer');
      if (btnWaiter) {
        btnWaiter.addEventListener('click', () => {
          leftPanelType = 'waiter';
          renderSandboxFrames();
        });
      }
      if (btnCustomer) {
        btnCustomer.addEventListener('click', () => {
          leftPanelType = 'customer';
          renderSandboxFrames();
        });
      }

      // Panel dropdown selectors listeners
      const selectLeft = container.querySelector('#select-panel-left');
      if (selectLeft) {
        selectLeft.addEventListener('change', (e) => {
          activePanelLeft = e.target.value;
          renderSandboxFrames();
        });
      }

      const selectRight = container.querySelector('#select-panel-right');
      if (selectRight) {
        selectRight.addEventListener('change', (e) => {
          activePanelRight = e.target.value;
          renderSandboxFrames();
        });
      }

      const selectFocus = container.querySelector('#select-panel-focus');
      if (selectFocus) {
        selectFocus.addEventListener('change', (e) => {
          activePanelFocus = e.target.value;
          renderSandboxFrames();
        });
      }
    };

    renderSandboxFrames();
  }
};
