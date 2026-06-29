// js/db.js - State Management and Database Layer

const DB_KEY = 'restaurant_ops_db';

const DEFAULT_MENU = [
  { id: 'm1', name: 'Crispy Garlic Bread', price: 6.99, category: 'Starters', station: 'Oven', description: 'Toasted baguette with garlic butter and herbs.', available: true, options: [{ name: 'Add Cheese', price: 1.50 }] },
  { id: 'm2', name: 'Loaded Nachos', price: 10.99, category: 'Starters', station: 'Grill & Fry', description: 'Tortilla chips with cheese sauce, jalapenos, and salsa.', available: true, options: [{ name: 'Add Guacamole', price: 2.00 }, { name: 'Add Chili Chicken', price: 3.00 }] },
  { id: 'm3', name: 'Fiery Chicken Wings', price: 9.99, category: 'Starters', station: 'Grill & Fry', description: 'Crispy chicken wings tossed in hot buffalo sauce.', available: true, options: [{ name: 'Extra Spicy', price: 0.00 }, { name: 'Blue Cheese Dip', price: 1.00 }] },
  { id: 'm4', name: 'Paneer Tikka', price: 8.99, category: 'Starters', station: 'Oven', description: 'Marinated cottage cheese cubes grilled in tandoor.', available: true, options: [{ name: 'Extra Mint Chutney', price: 0.50 }] },
  
  { id: 'm5', name: 'Classic Beef Burger', price: 13.99, category: 'Mains', station: 'Grill & Fry', description: 'Juicy beef patty with lettuce, tomato, cheese, and house sauce.', available: true, options: [{ name: 'Extra Bacon', price: 2.00 }, { name: 'Gluten-Free Bun', price: 1.50 }, { name: 'Add Egg', price: 1.50 }] },
  { id: 'm6', name: 'Penne Alfredo Pasta', price: 12.99, category: 'Mains', station: 'Oven', description: 'Penne pasta tossed in rich parmesan cream sauce.', available: true, options: [{ name: 'Add Grilled Chicken', price: 3.50 }, { name: 'Add Mushrooms', price: 1.50 }] },
  { id: 'm7', name: 'Paneer Butter Masala', price: 11.99, category: 'Mains', station: 'Oven', description: 'Rich cottage cheese curry served with 2 Butter Naans.', available: true, options: [{ name: 'Extra Butter Naan', price: 2.00 }] },
  { id: 'm8', name: 'Grilled Salmon', price: 18.99, category: 'Mains', station: 'Grill & Fry', description: 'Atlantic salmon fillet served with grilled veggies.', available: true, options: [{ name: 'Lemon Butter Sauce', price: 0.00 }] },
  
  { id: 'm9', name: 'Chocolate Fudge Brownie', price: 5.99, category: 'Desserts', station: 'Pantry', description: 'Warm brownie served with a scoop of vanilla ice cream.', available: true, options: [{ name: 'Extra Ice Cream', price: 1.50 }] },
  { id: 'm10', name: 'NY Style Cheesecake', price: 6.99, category: 'Desserts', station: 'Pantry', description: 'Creamy cheesecake on a graham cracker crust.', available: true, options: [{ name: 'Strawberry Drizzle', price: 0.50 }] },
  
  { id: 'm11', name: 'Iced Latte', price: 3.99, category: 'Beverages', station: 'Bar', description: 'Double espresso shot with milk and ice.', available: true, options: [{ name: 'Oat Milk', price: 0.75 }, { name: 'Vanilla Syrup', price: 0.50 }] },
  { id: 'm12', name: 'Fresh Mint Mojito', price: 4.99, category: 'Beverages', station: 'Bar', description: 'Classic refreshing lime and mint soda mocktail.', available: true, options: [{ name: 'Add Strawberries', price: 1.00 }] },
  { id: 'm13', name: 'Local Craft Beer', price: 6.50, category: 'Beverages', station: 'Bar', description: 'IPAs and lagers brewed locally.', available: true, options: [] },
  { id: 'm14', name: 'Mineral Water', price: 1.99, category: 'Beverages', station: 'Bar', description: 'Chilled spring water bottle.', available: true, options: [] }
];

const DEFAULT_TABLES = [
  { id: 'T1', number: '1', capacity: 2, status: 'free', seatedTime: null, activeOrderCount: 0, assignedStaff: 'Captain Bob' },
  { id: 'T2', number: '2', capacity: 2, status: 'free', seatedTime: null, activeOrderCount: 0, assignedStaff: 'Captain Bob' },
  { id: 'T3', number: '3', capacity: 4, status: 'occupied', seatedTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), activeOrderCount: 1, assignedStaff: 'Captain Alice' },
  { id: 'T4', number: '4', capacity: 4, status: 'bill_requested', seatedTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), activeOrderCount: 1, assignedStaff: 'Captain Alice' },
  { id: 'T5', number: '5', capacity: 6, status: 'free', seatedTime: null, activeOrderCount: 0, assignedStaff: 'Captain Bob' },
  { id: 'T6', number: '6', capacity: 6, status: 'reserved', seatedTime: null, activeOrderCount: 0, assignedStaff: 'Captain Bob', reservationName: 'Smith Party (19:30)' },
  { id: 'T7', number: '7', capacity: 8, status: 'cleaning', seatedTime: null, activeOrderCount: 0, assignedStaff: 'Captain Alice' },
  { id: 'T8', number: '8', capacity: 2, status: 'free', seatedTime: null, activeOrderCount: 0, assignedStaff: 'Captain Bob' }
];

const DEFAULT_USERS = [
  { username: 'owner', role: 'Owner', name: 'David (Owner)' },
  { username: 'manager', role: 'Manager', name: 'Sarah (Manager)' },
  { username: 'waiter1', role: 'Captain', name: 'Bob (Captain)' },
  { username: 'waiter2', role: 'Captain', name: 'Alice (Captain)' },
  { username: 'kitchen1', role: 'Kitchen Staff', name: 'Chef Maria (Kitchen)' },
  { username: 'cashier1', role: 'Cashier', name: 'Frank (Cashier)' },
  { username: 'delivery1', role: 'Delivery Staff', name: 'Rider Dave (Delivery)' }
];

const TAX_RATE = 0.05; // 5% GST
const SERVICE_CHARGE_RATE = 0.10; // 10% Service Charge

class DB {
  constructor() {
    this.listeners = [];
    this.init();
    
    // Sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === DB_KEY) {
        this.notify();
      }
    });
  }

  init() {
    let data = localStorage.getItem(DB_KEY);
    if (!data) {
      this.reset();
    } else {
      // Validate structure just in case
      try {
        const parsed = JSON.parse(data);
        if (!parsed.tables || !parsed.menu || !parsed.orders || !parsed.kots) {
          this.reset();
        }
      } catch (err) {
        this.reset();
      }
    }
  }

  reset() {
    const data = {
      menu: DEFAULT_MENU,
      tables: DEFAULT_TABLES,
      users: DEFAULT_USERS,
      orders: [
        // Populate standard orders for testing
        {
          id: 'O_T3',
          tableId: 'T3',
          type: 'dine-in',
          items: [
            { id: 'm1', name: 'Crispy Garlic Bread', price: 6.99, quantity: 2, modifications: [], sentToKOT: true, seatNumber: 1 },
            { id: 'm5', name: 'Classic Beef Burger', price: 13.99, quantity: 2, modifications: ['Extra Bacon'], sentToKOT: true, seatNumber: 2 }
          ],
          status: 'preparing',
          createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          notes: 'Customer allergic to walnuts.',
          waiterCalled: false,
          billRequested: false
        },
        {
          id: 'O_T4',
          tableId: 'T4',
          type: 'dine-in',
          items: [
            { id: 'm3', name: 'Fiery Chicken Wings', price: 9.99, quantity: 1, modifications: ['Blue Cheese Dip'], sentToKOT: true, seatNumber: 1 },
            { id: 'm6', name: 'Penne Alfredo Pasta', price: 12.99, quantity: 1, modifications: ['Add Grilled Chicken'], sentToKOT: true, seatNumber: 2 },
            { id: 'm12', name: 'Fresh Mint Mojito', price: 4.99, quantity: 2, modifications: [], sentToKOT: true, seatNumber: 2 }
          ],
          status: 'ready_to_serve',
          createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          notes: '',
          waiterCalled: false,
          billRequested: true
        }
      ],
      kots: [
        {
          id: 'KOT_101',
          kotNumber: 101,
          orderId: 'O_T3',
          tableNumber: '3',
          station: 'Oven',
          items: [
            { name: 'Crispy Garlic Bread', quantity: 2, modifications: [] }
          ],
          status: 'ready',
          priority: 'medium',
          createdAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 38 * 60 * 1000).toLocaleTimeString()
        },
        {
          id: 'KOT_102',
          kotNumber: 102,
          orderId: 'O_T3',
          tableNumber: '3',
          station: 'Grill & Fry',
          items: [
            { name: 'Classic Beef Burger', quantity: 2, modifications: ['Extra Bacon'] }
          ],
          status: 'preparing',
          priority: 'medium',
          createdAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 38 * 60 * 1000).toLocaleTimeString()
        },
        {
          id: 'KOT_103',
          kotNumber: 103,
          orderId: 'O_T4',
          tableNumber: '4',
          station: 'Grill & Fry',
          items: [
            { name: 'Fiery Chicken Wings', quantity: 1, modifications: ['Blue Cheese Dip'] }
          ],
          status: 'ready',
          priority: 'medium',
          createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 50 * 60 * 1000).toLocaleTimeString()
        },
        {
          id: 'KOT_104',
          kotNumber: 104,
          orderId: 'O_T4',
          tableNumber: '4',
          station: 'Oven',
          items: [
            { name: 'Penne Alfredo Pasta', quantity: 1, modifications: ['Add Grilled Chicken'] }
          ],
          status: 'ready',
          priority: 'high',
          createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 50 * 60 * 1000).toLocaleTimeString()
        },
        {
          id: 'KOT_105',
          kotNumber: 105,
          orderId: 'O_T4',
          tableNumber: '4',
          station: 'Bar',
          items: [
            { name: 'Fresh Mint Mojito', quantity: 2, modifications: [] }
          ],
          status: 'ready',
          priority: 'medium',
          createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 48 * 60 * 1000).toLocaleTimeString()
        }
      ],
      aggregators: [
        {
          id: 'A1',
          platform: 'Swiggy',
          orderNumber: 'SW-89472',
          items: [
            { name: 'Classic Beef Burger', quantity: 1, modifications: ['Extra Bacon'] },
            { name: 'Chocolate Fudge Brownie', quantity: 1, modifications: [] }
          ],
          status: 'preparing',
          riderName: 'Rohan Sharma',
          riderPhone: '+91 98765 43210',
          eta: '12 mins',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: 'A2',
          platform: 'Zomato',
          orderNumber: 'ZM-29402',
          items: [
            { name: 'Penne Alfredo Pasta', quantity: 2, modifications: [] },
            { name: 'Iced Latte', quantity: 1, modifications: ['Oat Milk'] }
          ],
          status: 'incoming',
          riderName: 'Waiting assignment',
          riderPhone: '-',
          eta: '25 mins',
          createdAt: new Date().toISOString()
        }
      ],
      logs: [
        { id: 'L1', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), user: 'Frank (Cashier)', action: 'System started & initialised.' }
      ],
      settings: {
        printerIP: '192.168.1.200',
        receiptSize: '80mm',
        autoPrintKOT: true,
        enableAggregators: true
      },
      kotCounter: 106,
      auditHistory: [
        { id: 'AH1', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), table: 'Table 3', action: 'Captain Alice added Penne Alfredo Pasta', authorizedBy: 'Captain Alice' }
      ],
      salesHistory: [
        // Dummy settled sales for reporting
        {
          id: 'S1',
          orderId: 'O_OLD1',
          type: 'dine-in',
          tableNumber: '1',
          items: [{ name: 'Classic Beef Burger', price: 13.99, quantity: 1, modifications: [] }],
          subtotal: 13.99,
          tax: 0.70,
          serviceCharge: 1.40,
          discount: 0,
          tip: 2.00,
          total: 18.09,
          paymentMethod: 'UPI',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'S2',
          orderId: 'O_OLD2',
          type: 'dine-in',
          tableNumber: '2',
          items: [
            { name: 'Paneer Butter Masala', price: 11.99, quantity: 2, modifications: [] },
            { name: 'Fresh Mint Mojito', price: 4.99, quantity: 2, modifications: [] }
          ],
          subtotal: 33.96,
          tax: 1.70,
          serviceCharge: 3.40,
          discount: 3.40, // 10% promo
          tip: 5.00,
          total: 40.66,
          paymentMethod: 'Mixed (Cash + Card)',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    this.save(data);
  }

  getData() {
    return JSON.parse(localStorage.getItem(DB_KEY));
  }

  save(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  // --- ACTIONS ---

  // Log Actions
  addLog(user, action) {
    const data = this.getData();
    data.logs.unshift({
      id: 'L_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: user || 'System',
      action
    });
    this.save(data);
  }

  // Audit History
  addAudit(table, action, authorizedBy) {
    const data = this.getData();
    data.auditHistory.unshift({
      id: 'AH_' + Date.now(),
      timestamp: new Date().toISOString(),
      table,
      action,
      authorizedBy
    });
    this.save(data);
  }

  // Tables
  updateTableStatus(tableId, status, seatedTime = undefined) {
    const data = this.getData();
    const table = data.tables.find(t => t.id === tableId);
    if (table) {
      table.status = status;
      if (seatedTime !== undefined) {
        table.seatedTime = seatedTime;
      }
      if (status === 'free') {
        table.seatedTime = null;
        table.activeOrderCount = 0;
        table.reservationName = null;
      }
      this.save(data);
    }
  }

  reserveTable(tableId, name) {
    const data = this.getData();
    const table = data.tables.find(t => t.id === tableId);
    if (table) {
      table.status = 'reserved';
      table.reservationName = name;
      this.save(data);
    }
  }

  mergeTables(primaryId, mergeIds) {
    const data = this.getData();
    const primary = data.tables.find(t => t.id === primaryId);
    if (primary) {
      const mergedNames = [];
      mergeIds.forEach(id => {
        const t = data.tables.find(tbl => tbl.id === id);
        if (t) {
          t.status = 'occupied';
          t.seatedTime = primary.seatedTime || new Date().toISOString();
          mergedNames.push(t.number);
        }
      });
      primary.status = 'occupied';
      if (!primary.seatedTime) primary.seatedTime = new Date().toISOString();
      this.addLog(null, `Tables merged: Table ${primary.number} with Table(s) ${mergedNames.join(', ')}`);
      this.save(data);
    }
  }

  // Menu Management
  setMenuAvailability(itemId, available) {
    const data = this.getData();
    const item = data.menu.find(m => m.id === itemId);
    if (item) {
      item.available = available;
      this.addLog(null, `Menu item '${item.name}' availability set to ${available}`);
      this.save(data);
    }
  }

  // Orders
  getOrCreateOrderForTable(tableId) {
    const data = this.getData();
    let order = data.orders.find(o => o.tableId === tableId && o.status !== 'settled');
    if (!order) {
      const table = data.tables.find(t => t.id === tableId);
      order = {
        id: 'O_' + tableId + '_' + Date.now(),
        tableId: tableId,
        type: 'dine-in',
        items: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
        notes: '',
        waiterCalled: false,
        billRequested: false
      };
      data.orders.push(order);
      if (table) {
        table.status = 'occupied';
        table.seatedTime = new Date().toISOString();
        table.activeOrderCount = 1;
      }
      this.save(data);
    }
    return order;
  }

  saveOrder(order) {
    const data = this.getData();
    const index = data.orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      data.orders[index] = order;
    } else {
      data.orders.push(order);
    }
    this.save(data);
  }

  // Submit items to Kitchen Order Ticket (KOT)
  sendToKitchen(orderId, priority = 'medium', userName = 'Captain') {
    const data = this.getData();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = order.items.filter(item => !item.sentToKOT);
    if (newItems.length === 0) return;

    // Group new items by kitchen station
    const stationGroups = {};
    newItems.forEach(item => {
      const menuDetail = data.menu.find(m => m.id === item.id);
      const station = menuDetail ? menuDetail.station : 'Kitchen';
      
      if (!stationGroups[station]) {
        stationGroups[station] = [];
      }
      stationGroups[station].push(item);
    });

    const table = data.tables.find(t => t.id === order.tableId);
    const tableNumber = table ? table.number : 'Unknown';

    // Generate KOTs
    Object.keys(stationGroups).forEach(station => {
      const kotNum = data.kotCounter++;
      const newKOT = {
        id: 'KOT_' + kotNum + '_' + Date.now(),
        kotNumber: kotNum,
        orderId: order.id,
        tableNumber,
        station,
        items: stationGroups[station].map(i => ({
          name: i.name,
          quantity: i.quantity,
          modifications: [...i.modifications]
        })),
        status: 'preparing',
        priority,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toLocaleTimeString()
      };
      
      data.kots.push(newKOT);
    });

    // Mark items as sent in order
    order.items.forEach(item => {
      item.sentToKOT = true;
    });

    order.status = 'preparing';
    if (table) {
      table.activeOrderCount = 1;
    }

    this.addLog(userName, `Generated KOTs for Table ${tableNumber} (Order ID: ${order.id})`);
    this.save(data);
  }

  // Edit Cart / Items (including deletions, additions)
  updateOrderItems(orderId, updatedItems, auditAuthorizer = null) {
    const data = this.getData();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;

    const table = data.tables.find(t => t.id === order.tableId);
    const tableNum = table ? table.number : 'Unknown';

    // Audit changes
    if (auditAuthorizer) {
      // Find deleted or reduced items
      order.items.forEach(oldItem => {
        const updatedItem = updatedItems.find(ui => ui.id === oldItem.id && JSON.stringify(ui.modifications) === JSON.stringify(oldItem.modifications));
        if (!updatedItem) {
          this.addAudit(`Table ${tableNum}`, `Removed item ${oldItem.name} (x${oldItem.quantity})`, auditAuthorizer);
        } else if (updatedItem.quantity < oldItem.quantity) {
          this.addAudit(`Table ${tableNum}`, `Reduced item ${oldItem.name} quantity from ${oldItem.quantity} to ${updatedItem.quantity}`, auditAuthorizer);
        }
      });
      
      // Find added items
      updatedItems.forEach(newItem => {
        const oldItem = order.items.find(oi => oi.id === newItem.id && JSON.stringify(oi.modifications) === JSON.stringify(newItem.modifications));
        if (!oldItem) {
          this.addAudit(`Table ${tableNum}`, `Added item ${newItem.name} (x${newItem.quantity})`, auditAuthorizer);
        } else if (newItem.quantity > oldItem.quantity) {
          this.addAudit(`Table ${tableNum}`, `Increased item ${newItem.name} quantity from ${oldItem.quantity} to ${newItem.quantity}`, auditAuthorizer);
        }
      });
    }

    order.items = updatedItems;
    this.save(data);
  }

  cancelOrder(orderId, reason, authorizer) {
    const data = this.getData();
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'cancelled';
      const table = data.tables.find(t => t.id === order.tableId);
      const tableNum = table ? table.number : 'Unknown';
      
      if (table) {
        table.status = 'free';
        table.seatedTime = null;
        table.activeOrderCount = 0;
      }
      
      // Cancel associated active KOTs
      data.kots.forEach(kot => {
        if (kot.orderId === orderId && kot.status !== 'ready' && kot.status !== 'bumped') {
          kot.status = 'cancelled';
        }
      });

      this.addAudit(`Table ${tableNum}`, `Order CANCELLED. Reason: ${reason}`, authorizer);
      this.addLog(authorizer, `Cancelled Order ${orderId} for Table ${tableNum}`);
      this.save(data);
    }
  }

  // KOT bumps
  updateKOTStatus(kotId, status) {
    const data = this.getData();
    const kot = data.kots.find(k => k.id === kotId);
    if (kot) {
      kot.status = status;
      this.addLog(null, `KOT #${kot.kotNumber} marked as ${status}`);
      
      // Check if all KOTs for this order are ready/bumped to update Order status
      const associatedKOTs = data.kots.filter(k => k.orderId === kot.orderId);
      const order = data.orders.find(o => o.id === kot.orderId);
      if (order) {
        const allReady = associatedKOTs.every(k => k.status === 'ready' || k.status === 'bumped' || k.status === 'cancelled');
        if (allReady) {
          order.status = 'ready_to_serve';
        }
      }
      
      this.save(data);
    }
  }

  // Tableside customer actions
  callStaff(tableId, message = 'Assistance requested') {
    const data = this.getData();
    const table = data.tables.find(t => t.id === tableId);
    if (table) {
      table.waiterCalled = true;
      table.waiterCallMessage = message;
      
      const order = data.orders.find(o => o.tableId === tableId && o.status !== 'settled');
      if (order) {
        order.waiterCalled = true;
      }

      this.addLog('Customer', `Table ${table.number} requested staff: "${message}"`);
      this.save(data);
    }
  }

  dismissStaffCall(tableId) {
    const data = this.getData();
    const table = data.tables.find(t => t.id === tableId);
    if (table) {
      table.waiterCalled = false;
      table.waiterCallMessage = null;
      
      const order = data.orders.find(o => o.tableId === tableId && o.status !== 'settled');
      if (order) {
        order.waiterCalled = false;
      }
      this.save(data);
    }
  }

  requestBill(tableId) {
    const data = this.getData();
    const table = data.tables.find(t => t.id === tableId);
    if (table) {
      table.status = 'bill_requested';
      
      const order = data.orders.find(o => o.tableId === tableId && o.status !== 'settled');
      if (order) {
        order.billRequested = true;
      }
      
      this.addLog('Customer', `Table ${table.number} requested bill.`);
      this.save(data);
    }
  }

  // Settle Bill
  settleOrder(orderId, paymentDetails) {
    const data = this.getData();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = 'settled';
    order.paymentDetails = paymentDetails;

    const table = data.tables.find(t => t.id === order.tableId);
    if (table) {
      table.status = 'cleaning'; // Goes to cleaning after bill is paid
      table.seatedTime = null;
      table.activeOrderCount = 0;
      table.waiterCalled = false;
      table.waiterCallMessage = null;
    }

    // Save sales history
    const saleRecord = {
      id: 'S_' + Date.now(),
      orderId: order.id,
      type: order.type,
      tableNumber: table ? table.number : 'Delivery',
      items: order.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, modifications: i.modifications })),
      subtotal: paymentDetails.subtotal,
      tax: paymentDetails.tax,
      serviceCharge: paymentDetails.serviceCharge,
      discount: paymentDetails.discount,
      tip: paymentDetails.tip,
      total: paymentDetails.total,
      paymentMethod: paymentDetails.method,
      timestamp: new Date().toISOString()
    };
    data.salesHistory.push(saleRecord);

    this.addLog('Cashier', `Settled Table ${table ? table.number : 'Delivery'} total: $${paymentDetails.total.toFixed(2)} via ${paymentDetails.method}`);
    this.save(data);
  }

  // Aggregator
  addAggregatorOrder(platform, orderNum, items, notes = '') {
    const data = this.getData();
    const newAgg = {
      id: 'A_' + Date.now(),
      platform,
      orderNumber: orderNum,
      items,
      status: 'incoming',
      riderName: 'Waiting assignment',
      riderPhone: '-',
      eta: '25 mins',
      createdAt: new Date().toISOString(),
      notes
    };
    data.aggregators.unshift(newAgg);
    this.addLog('Aggregator', `Incoming ${platform} Order #${orderNum}`);
    this.save(data);
  }

  updateAggregatorStatus(aggId, status, riderDetails = {}) {
    const data = this.getData();
    const agg = data.aggregators.find(a => a.id === aggId);
    if (agg) {
      agg.status = status;
      if (riderDetails.name) agg.riderName = riderDetails.name;
      if (riderDetails.phone) agg.riderPhone = riderDetails.phone;
      if (riderDetails.eta) agg.eta = riderDetails.eta;
      
      this.addLog('Delivery', `Aggregator Order #${agg.orderNumber} status: ${status}`);
      
      // Auto-archive or log completed ones into salesHistory
      if (status === 'delivered') {
        const subtotal = agg.items.reduce((sum, item) => sum + (item.price || 9.99) * item.quantity, 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;
        
        const saleRecord = {
          id: 'S_' + Date.now(),
          orderId: agg.id,
          type: 'delivery',
          tableNumber: agg.platform,
          items: agg.items.map(i => ({ name: i.name, price: i.price || 9.99, quantity: i.quantity, modifications: i.modifications || [] })),
          subtotal,
          tax,
          serviceCharge: 0,
          discount: 0,
          tip: 0,
          total,
          paymentMethod: 'Online Platform',
          timestamp: new Date().toISOString()
        };
        data.salesHistory.push(saleRecord);
      }
      
      this.save(data);
    }
  }

  // Printer Config
  updatePrinterSettings(ip, size, autoPrint) {
    const data = this.getData();
    data.settings.printerIP = ip;
    data.settings.receiptSize = size;
    data.settings.autoPrintKOT = autoPrint;
    this.save(data);
  }

  // Close Day Operation
  closeDay(userName) {
    const data = this.getData();
    
    // Check if there are active dine-in orders
    const activeOrders = data.orders.filter(o => o.status !== 'settled' && o.status !== 'cancelled');
    if (activeOrders.length > 0) {
      throw new Error(`Cannot close day: There are still ${activeOrders.length} active tables.`);
    }

    const report = this.getDailyReportDetails();
    
    // Clean active data for a fresh start, while preserving historical sales
    data.orders = [];
    data.kots = [];
    data.aggregators = [];
    data.tables.forEach(t => {
      t.status = 'free';
      t.seatedTime = null;
      t.activeOrderCount = 0;
      t.waiterCalled = false;
      t.waiterCallMessage = null;
    });
    data.kotCounter = 101;
    data.logs = [{ id: 'L_' + Date.now(), timestamp: new Date().toISOString(), user: userName, action: 'Day closed and system reset for next service.' }];
    data.auditHistory = [];

    this.save(data);
    return report;
  }

  // Report calculations
  getDailyReportDetails() {
    const data = this.getData();
    const today = new Date().toDateString();
    
    const todaysSales = data.salesHistory.filter(s => new Date(s.timestamp).toDateString() === today);
    
    let totalSales = 0;
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalService = 0;
    let totalDiscount = 0;
    let totalTip = 0;
    
    const paymentBreakdown = { Cash: 0, Card: 0, UPI: 0, 'Online Platform': 0, Mixed: 0 };
    const categoryPopularity = {};
    const itemVolume = {};

    todaysSales.forEach(s => {
      totalSales += s.total;
      totalSubtotal += s.subtotal;
      totalTax += s.tax;
      totalService += s.serviceCharge;
      totalDiscount += s.discount;
      totalTip += s.tip;

      // Payment methods breakdown
      const method = s.paymentMethod;
      if (method.includes('Mixed')) {
        paymentBreakdown['Mixed'] += s.total;
      } else if (paymentBreakdown[method] !== undefined) {
        paymentBreakdown[method] += s.total;
      } else {
        paymentBreakdown[method] = s.total;
      }

      // Popularity
      s.items.forEach(item => {
        itemVolume[item.name] = (itemVolume[item.name] || 0) + item.quantity;
        
        // Find category from current menu
        const menuDetail = data.menu.find(m => m.name === item.name);
        const cat = menuDetail ? menuDetail.category : 'Other';
        categoryPopularity[cat] = (categoryPopularity[cat] || 0) + item.quantity;
      });
    });

    const busyTablesCount = data.tables.filter(t => t.status === 'occupied' || t.status === 'bill_requested').length;

    return {
      salesCount: todaysSales.length,
      totalSales,
      totalSubtotal,
      totalTax,
      totalService,
      totalDiscount,
      totalTip,
      paymentBreakdown,
      categoryPopularity,
      popularItems: Object.entries(itemVolume).sort((a, b) => b[1] - a[1]).slice(0, 5),
      busyTablesCount
    };
  }
}

const db = new DB();
export default db;
export { TAX_RATE, SERVICE_CHARGE_RATE };
