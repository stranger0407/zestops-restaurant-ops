// js/app.js - Central Coordinator and Router

import db from './db.js';
import loginScreen from './components/login.js';
import dashboardScreen from './components/dashboard.js';
import tableGridScreen from './components/tableGrid.js';
import orderEntryScreen from './components/orderEntry.js';
import qrMenuScreen from './components/qrMenu.js';
import kdsScreen from './components/kds.js';
import aggregatorScreen from './components/aggregator.js';
import billingScreen from './components/billing.js';
import reportsScreen from './components/reports.js';
import settingsScreen from './components/settings.js';
import sandboxScreen from './components/sandbox.js';

// Application State
let currentUser = { name: 'Sarah (Manager)', role: 'Manager', username: 'manager' };
let currentRoute = '#dashboard';
let routeParams = {};
let isSidebarCollapsed = window.innerWidth <= 768;

const ROUTES = {
  '#login': loginScreen,
  '#dashboard': dashboardScreen,
  '#tables': tableGridScreen,
  '#order-entry': orderEntryScreen,
  '#qr-menu': qrMenuScreen,
  '#kds': kdsScreen,
  '#aggregator': aggregatorScreen,
  '#billing': billingScreen,
  '#reports': reportsScreen,
  '#settings': settingsScreen,
  '#sandbox': sandboxScreen
};

// Start application
function init() {
  setupClock();
  setupRoleSwitcher();
  setupNotificationBell();
  setupSimulationLoop();
  setupMobileMenu();
  
  // Listen to hash routing changes
  window.addEventListener('hashchange', handleRouting);
  
  // Subscribe to database changes to trigger reactive UI updates
  db.subscribe(() => {
    updateNotificationBadge();
    renderCurrentScreen();
  });

  // Initial routing
  handleRouting();
}

// 1. Clock Updates
function setupClock() {
  const clockEl = document.getElementById('clock-display');
  if (clockEl) {
    setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      clockEl.textContent = timeStr;
    }, 1000);
  }
}

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('btn-toggle-menu-mobile');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      isSidebarCollapsed = !isSidebarCollapsed;
      document.getElementById('app').classList.toggle('sidebar-collapsed', isSidebarCollapsed);
    });
  }
}

// 2. Role switching handler
function setupRoleSwitcher() {
  const switcher = document.getElementById('quick-role-switcher');
  const roleTag = document.getElementById('current-role-tag');
  
  if (switcher) {
    switcher.addEventListener('change', (e) => {
      const selectedRole = e.target.value;
      
      // Update local state
      currentUser = {
        name: `${selectedRole} Agent`,
        role: selectedRole,
        username: selectedRole.toLowerCase().replace(' ', '')
      };
      
      // Update UI components
      if (roleTag) roleTag.textContent = `Role: ${selectedRole}`;
      
      updateUserWidget();
      updateSidebarLinks();
      
      // Auto routing if role changes to restricted screen
      if (selectedRole === 'Customer') {
        routerNavigate('#qr-menu?tableId=T4');
      } else if (selectedRole === 'Kitchen Staff') {
        routerNavigate('#kds');
      } else if (selectedRole === 'Delivery Staff') {
        routerNavigate('#aggregator');
      } else {
        routerNavigate('#dashboard');
      }
    });
  }
}

function updateUserWidget() {
  const avatar = document.getElementById('widget-avatar');
  const name = document.getElementById('widget-name');
  const role = document.getElementById('widget-role');
  
  if (avatar) avatar.textContent = currentUser.role.substring(0, 1);
  if (name) name.textContent = currentUser.name.split(' ')[0];
  if (role) role.textContent = currentUser.role;
}

// 3. Navigation Sidebar Links based on Roles
const ROLE_PERMISSIONS = {
  'Owner': ['#dashboard', '#tables', '#order-entry', '#kds', '#aggregator', '#billing', '#reports', '#settings', '#sandbox'],
  'Manager': ['#dashboard', '#tables', '#order-entry', '#kds', '#aggregator', '#billing', '#reports', '#settings', '#sandbox'],
  'Captain': ['#tables', '#order-entry', '#sandbox'],
  'Kitchen Staff': ['#kds', '#sandbox'],
  'Cashier': ['#tables', '#billing', '#reports', '#sandbox'],
  'Delivery Staff': ['#aggregator', '#sandbox'],
  'Customer': ['#qr-menu']
};

function updateSidebarLinks() {
  const menu = document.getElementById('sidebar-menu');
  if (!menu) return;

  const allowedRoutes = ROLE_PERMISSIONS[currentUser.role] || [];
  
  const linkDetails = {
    '#dashboard': { title: '📊 Dashboard', role: 'Manager/Owner' },
    '#tables': { title: '🍽️ Table Grid', role: 'Captain/Cashier/Manager' },
    '#order-entry': { title: '📝 Order Entry', role: 'Captain/Waiter' },
    '#kds': { title: '🍳 Kitchen Display', role: 'Kitchen Staff' },
    '#aggregator': { title: '🛵 Delivery Feed', role: 'Delivery Staff' },
    '#billing': { title: '💳 Settle Bills', role: 'Cashier/Billing' },
    '#reports': { title: '📈 Sales Reports', role: 'Owner/Manager' },
    '#settings': { title: '⚙️ Settings', role: 'System Admin' },
    '#sandbox': { title: '⚡ Operations Sandbox', role: 'All-in-one View' }
  };

  menu.innerHTML = allowedRoutes
    .filter(route => linkDetails[route])
    .map(route => `
      <li class="nav-item ${currentRoute === route ? 'active' : ''}">
        <a href="${route}">${linkDetails[route].title}</a>
      </li>
    `).join('');
}

// 4. Router Navigate Helper
function routerNavigate(hash) {
  window.location.hash = hash;
}

// Parse query params (e.g. #order-entry?tableId=T3)
function handleRouting() {
  const fullHash = window.location.hash || '#dashboard';
  const parts = fullHash.split('?');
  
  currentRoute = parts[0];
  routeParams = {};
  
  if (parts[1]) {
    const searchParams = new URLSearchParams(parts[1]);
    for (const [key, value] of searchParams.entries()) {
      routeParams[key] = value;
    }
  }

  // Adjust quick role switcher to match customer/standalone QR routing
  const switcher = document.getElementById('quick-role-switcher');
  const sidebar = document.getElementById('main-sidebar');
  const appHeader = document.querySelector('.app-header');
  const appContent = document.querySelector('.app-content');
  
  if (currentRoute === '#qr-menu') {
    // Hide standard shell headers for pure customer experience
    if (sidebar) sidebar.style.display = 'none';
    if (appHeader) appHeader.style.display = 'none';
    if (appContent) {
      appContent.style.marginLeft = '0';
      appContent.style.marginTop = '0';
      appContent.style.padding = '0';
    }
    currentUser.role = 'Customer';
  } else {
    if (sidebar) sidebar.style.display = 'flex';
    if (appHeader) appHeader.style.display = 'flex';
    if (appContent) {
      appContent.style.marginLeft = 'var(--sidebar-width)';
      appContent.style.marginTop = 'var(--header-height)';
      appContent.style.padding = '24px';
    }
  }

  // Auto-collapse sidebar on mobile after clicking a link
  if (window.innerWidth <= 768) {
    isSidebarCollapsed = true;
    const appContainer = document.getElementById('app');
    if (appContainer) appContainer.classList.add('sidebar-collapsed');
  }

  updateSidebarLinks();
  updateUserWidget();
  updateNotificationBadge();
  renderCurrentScreen();
}

function renderCurrentScreen() {
  const container = document.getElementById('active-screen-outlet');
  if (!container) return;

  const screenComponent = ROUTES[currentRoute];
  if (screenComponent) {
    // Inject screen views
    if (currentRoute === '#order-entry') {
      screenComponent.render(container, routerNavigate, currentUser.role, routeParams.tableId);
    } else if (currentRoute === '#qr-menu') {
      screenComponent.render(container, routerNavigate, routeParams.tableId);
    } else if (currentRoute === '#billing') {
      screenComponent.render(container, routerNavigate, routeParams.tableId);
    } else {
      screenComponent.render(container, routerNavigate);
    }
  } else {
    // Fallback
    container.innerHTML = `<h2>Screen ${currentRoute} not found.</h2>`;
  }
}

// 5. Caller assistance bell notification dropdown
function setupNotificationBell() {
  const bell = document.getElementById('bell-btn');
  if (bell) {
    bell.addEventListener('click', () => {
      const data = db.getData();
      const callingTables = data.tables.filter(t => t.waiterCalled);
      
      const modal = document.getElementById('global-modal');
      const content = document.getElementById('global-modal-content');
      
      content.innerHTML = `
        <div class="modal-header">
          <h2>🔔 Waiter Call Board</h2>
          <button class="btn btn-secondary btn-icon-only modal-close-btn" style="border-radius: 50%;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
          ${callingTables.length === 0 ? `
            <p style="text-align: center; color: var(--text-secondary); padding: 20px 0;">No active waiter calls right now.</p>
          ` : callingTables.map(t => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--danger-color);">
              <div>
                <strong>Table ${t.number} assistance</strong>
                <div style="font-size: 11px; color: var(--warning-color); margin-top: 2px;">
                  "${t.waiterCallMessage || 'Waiter requested'}"
                </div>
              </div>
              <button class="btn btn-success btn-clear-call" data-table-id="${t.id}" style="padding: 4px 10px; font-size: 11px;">
                Complete & Clear
              </button>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button class="btn btn-secondary modal-close-btn">Dismiss</button>
          </div>
        </div>
      `;
      
      modal.style.display = 'flex';
      
      const closeModal = () => modal.style.display = 'none';
      content.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));
      
      content.querySelectorAll('.btn-clear-call').forEach(btn => {
        btn.addEventListener('click', () => {
          const tId = btn.getAttribute('data-table-id');
          db.dismissStaffCall(tId);
          closeModal();
          alert('Call cleared.');
        });
      });
    });
  }
}

function updateNotificationBadge() {
  const badge = document.getElementById('bell-count');
  if (badge) {
    const data = db.getData();
    const count = data.tables.filter(t => t.waiterCalled).length;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// 6. Background Simulator (Spawns events periodically)
function setupSimulationLoop() {
  setInterval(() => {
    const data = db.getData();
    
    // 1. Swiggy/Zomato Order Spawner
    if (data.settings.enableAggregators && Math.random() < 0.2) {
      const platforms = ['Swiggy', 'Zomato'];
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      const orderNum = 'SW-' + Math.floor(10000 + Math.random() * 90000);
      
      db.addAggregatorOrder(plat, orderNum, [
        { name: 'Classic Beef Burger', price: 13.99, quantity: 1, modifications: [] },
        { name: 'Iced Latte', price: 3.99, quantity: 1, modifications: ['Vanilla Syrup'] }
      ], 'Simulated incoming delivery feed');
      
      if (window.playNotificationSound) {
        window.playNotificationSound(600, 0.3, 'sawtooth');
      }
    }
    
    // 2. Rider updates / completed delivery simulator
    const preparingAggs = data.aggregators.filter(a => a.status === 'preparing');
    if (preparingAggs.length > 0 && Math.random() < 0.3) {
      const order = preparingAggs[Math.floor(Math.random() * preparingAggs.length)];
      db.updateAggregatorStatus(order.id, 'out_for_delivery', { eta: '12 mins' });
    }

    const deliveryAggs = data.aggregators.filter(a => a.status === 'out_for_delivery');
    if (deliveryAggs.length > 0 && Math.random() < 0.2) {
      const order = deliveryAggs[Math.floor(Math.random() * deliveryAggs.length)];
      db.updateAggregatorStatus(order.id, 'delivered');
    }
    
    // 3. Customer tableside call simulator
    const occupiedTables = data.tables.filter(t => t.status === 'occupied' && !t.waiterCalled);
    if (occupiedTables.length > 0 && Math.random() < 0.15) {
      const tbl = occupiedTables[Math.floor(Math.random() * occupiedTables.length)];
      const messages = ['Requests extra napkins', 'Requests a bottle of water', 'Call waiter', 'Bill requested'];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      
      if (msg === 'Bill requested') {
        db.requestBill(tbl.id);
      } else {
        db.callStaff(tbl.id, msg);
      }
      
      if (window.playNotificationSound) {
        window.playNotificationSound(440, 0.25, 'sine');
      }
    }
    
  }, 35000); // Trigger every 35 seconds
}

// Bootstrap
document.addEventListener('DOMContentLoaded', init);
export { routerNavigate };
