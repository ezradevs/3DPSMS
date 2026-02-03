const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const isVercelHost =
  typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app');
const useDemoFallback =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  (isVercelHost && !import.meta.env.VITE_API_BASE_URL);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function dateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function asMoney(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function bodyToObject(body) {
  if (!body) return {};
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const data = {};
    for (const [key, value] of body.entries()) {
      data[key] = value;
    }
    return data;
  }
  return body;
}

function createDemoState() {
  const today = dateOnly();
  const yesterday = dateOnly(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const twoDaysAgo = dateOnly(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));

  return {
    nextIds: {
      item: 4,
      session: 3,
      sale: 5,
      customOrder: 3,
      spool: 4,
      usage: 4,
      job: 3,
      expense: 4,
    },
    items: [
      {
        id: 1,
        name: 'Plant Pot - Ribbed',
        description: '120mm indoor planter',
        price: 14.5,
        quantity: 9,
        imagePath: null,
        defaultFilamentId: 1,
        tag: 'Decorr',
      },
      {
        id: 2,
        name: 'Fidget Infinity Cube',
        description: 'Pocket-sized stress toy',
        price: 8,
        quantity: 3,
        imagePath: null,
        defaultFilamentId: 2,
        tag: 'Fidget Toy',
      },
      {
        id: 3,
        name: 'Cable Clip Set',
        description: '3-pack desk cable clips',
        price: 6,
        quantity: 16,
        imagePath: null,
        defaultFilamentId: 3,
        tag: 'Functional/Practical Item',
      },
    ],
    sessions: [
      {
        id: 1,
        title: 'Bondi Market Morning',
        location: 'Bondi',
        sessionDate: today,
        weather: 'Sunny, 24C',
        status: 'open',
        startedAt: `${today}T07:00:00.000Z`,
        endedAt: null,
      },
      {
        id: 2,
        title: 'Paddington Weekend Stall',
        location: 'Paddington',
        sessionDate: yesterday,
        weather: 'Partly cloudy',
        status: 'closed',
        startedAt: `${yesterday}T08:00:00.000Z`,
        endedAt: `${yesterday}T14:10:00.000Z`,
      },
    ],
    sales: [
      {
        id: 1,
        sessionId: 2,
        itemId: 1,
        quantity: 2,
        unitPrice: 14.5,
        totalPrice: 29,
        soldAt: `${yesterday}T09:12:00.000Z`,
        note: '',
        paymentMethod: 'card',
        cashReceived: null,
        changeGiven: null,
      },
      {
        id: 2,
        sessionId: 2,
        itemId: 2,
        quantity: 1,
        unitPrice: 8,
        totalPrice: 8,
        soldAt: `${yesterday}T11:30:00.000Z`,
        note: '',
        paymentMethod: 'cash',
        cashReceived: 10,
        changeGiven: 2,
      },
      {
        id: 3,
        sessionId: 1,
        itemId: 3,
        quantity: 2,
        unitPrice: 6,
        totalPrice: 12,
        soldAt: `${today}T09:05:00.000Z`,
        note: 'Bundle discount',
        paymentMethod: 'card',
        cashReceived: null,
        changeGiven: null,
      },
      {
        id: 4,
        sessionId: 1,
        itemId: 1,
        quantity: 1,
        unitPrice: 14.5,
        totalPrice: 14.5,
        soldAt: `${today}T09:44:00.000Z`,
        note: '',
        paymentMethod: 'cash',
        cashReceived: 20,
        changeGiven: 5.5,
      },
    ],
    customOrders: [
      {
        id: 1,
        customerName: 'Mia Carter',
        contactInfo: '@mia.crafts',
        source: 'instagram',
        status: 'in_progress',
        dueDate: today,
        requestDetails: 'Custom vase with wave pattern',
        notes: 'Use matte white PLA',
        quotedPrice: 45,
        depositPaid: 20,
        createdAt: `${twoDaysAgo}T10:00:00.000Z`,
      },
      {
        id: 2,
        customerName: 'Logan Perez',
        contactInfo: 'logan@example.com',
        source: 'email',
        status: 'new',
        dueDate: '',
        requestDetails: 'Desk organizer with phone stand',
        notes: '',
        quotedPrice: 35,
        depositPaid: null,
        createdAt: `${yesterday}T15:30:00.000Z`,
      },
    ],
    spools: [
      {
        id: 1,
        material: 'PLA',
        color: 'Matte White',
        brand: 'Bambu',
        owner: 'Ezra',
        dryness: 'sealed',
        weightGrams: 1000,
        remainingGrams: 640,
        cost: 34,
        purchaseDate: twoDaysAgo,
        notes: '',
      },
      {
        id: 2,
        material: 'PLA Silk',
        color: 'Gold',
        brand: 'eSUN',
        owner: 'Dylan',
        dryness: 'open',
        weightGrams: 1000,
        remainingGrams: 420,
        cost: 37,
        purchaseDate: yesterday,
        notes: '',
      },
      {
        id: 3,
        material: 'PETG',
        color: 'Black',
        brand: 'Polymaker',
        owner: '',
        dryness: 'vacuum',
        weightGrams: 1000,
        remainingGrams: 890,
        cost: 39,
        purchaseDate: today,
        notes: '',
      },
    ],
    usageLogs: [
      {
        id: 1,
        spoolId: 1,
        usedGrams: 130,
        reason: 'Plant pots batch',
        reference: 'S-1021',
        createdAt: `${yesterday}T10:00:00.000Z`,
      },
      {
        id: 2,
        spoolId: 2,
        usedGrams: 180,
        reason: 'Fidget cubes',
        reference: 'S-1022',
        createdAt: `${yesterday}T12:00:00.000Z`,
      },
      {
        id: 3,
        spoolId: 1,
        usedGrams: 50,
        reason: 'Custom order',
        reference: 'CO-001',
        createdAt: `${today}T08:20:00.000Z`,
      },
    ],
    printJobs: [
      {
        id: 1,
        itemName: 'Fidget Infinity Cube',
        filamentSpoolId: 2,
        quantity: 6,
        assignee: 'Ezra',
        notes: 'Prep for Saturday market',
        modelUrl: 'https://example.com/model/fidget-cube',
        modelFilePath: null,
        status: 'printing',
        priority: 2,
        dueDate: today,
        createdAt: `${today}T07:10:00.000Z`,
      },
      {
        id: 2,
        itemName: 'Planter 120mm',
        filamentSpoolId: 1,
        quantity: 4,
        assignee: 'Dylan',
        notes: '',
        modelUrl: 'https://example.com/model/planter-120',
        modelFilePath: null,
        status: 'queued',
        priority: 1,
        dueDate: tomorrowDate(today),
        createdAt: `${today}T08:00:00.000Z`,
      },
    ],
    expenses: [
      {
        id: 1,
        description: 'Saturday market stall fee',
        amount: 120,
        category: 'Market Stall',
        payer: 'Business',
        assignee: 'Ezra',
        expenseDate: yesterday,
        notes: '',
      },
      {
        id: 2,
        description: 'Filament reorder',
        amount: 78,
        category: 'Filament',
        payer: 'Business',
        assignee: 'Dylan',
        expenseDate: today,
        notes: '2x PLA, 1x PETG',
      },
      {
        id: 3,
        description: 'Display plants',
        amount: 28.5,
        category: 'Plants',
        payer: 'Ezra',
        assignee: '',
        expenseDate: today,
        notes: '',
      },
    ],
  };
}

function tomorrowDate(today) {
  const base = new Date(`${today}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + 1);
  return base.toISOString().slice(0, 10);
}

let demoState = createDemoState();

function getItem(id) {
  return demoState.items.find(item => item.id === Number(id));
}

function getSpool(id) {
  return demoState.spools.find(spool => spool.id === Number(id));
}

function serializeItem(item) {
  return {
    ...item,
    defaultFilament: item.defaultFilamentId ? getSpool(item.defaultFilamentId) || null : null,
  };
}

function sessionTotals(sessionId) {
  const sales = demoState.sales.filter(sale => sale.sessionId === sessionId);
  return {
    totalRevenue: sales.reduce((sum, sale) => sum + sale.totalPrice, 0),
    totalItemsSold: sales.reduce((sum, sale) => sum + sale.quantity, 0),
    saleCount: sales.length,
  };
}

function serializeSession(session) {
  return {
    ...session,
    ...sessionTotals(session.id),
  };
}

function serializeSale(sale) {
  const item = getItem(sale.itemId);
  const session = demoState.sessions.find(entry => entry.id === sale.sessionId);
  return {
    ...sale,
    itemName: item?.name || 'Unknown item',
    sessionTitle: session?.title || 'Session',
  };
}

function serializeSessionDetail(sessionId) {
  const session = demoState.sessions.find(entry => entry.id === Number(sessionId));
  if (!session) {
    throw new Error('Session not found');
  }
  const sales = demoState.sales
    .filter(sale => sale.sessionId === session.id)
    .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
    .map(serializeSale);
  return {
    ...serializeSession(session),
    sales,
  };
}

function buildDashboard() {
  const today = dateOnly();
  const todaySession = demoState.sessions.find(
    session => session.sessionDate === today && session.status === 'open',
  );
  const todaySummary = todaySession ? serializeSession(todaySession) : null;

  const lowStockItems = demoState.items
    .filter(item => item.quantity < 5)
    .sort((a, b) => a.quantity - b.quantity)
    .map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price }));

  const recentTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = dateOnly(new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000));
    const salesForDay = demoState.sales.filter(sale => sale.soldAt.slice(0, 10) === date);
    return {
      date,
      totalRevenue: salesForDay.reduce((sum, sale) => sum + sale.totalPrice, 0),
      totalItems: salesForDay.reduce((sum, sale) => sum + sale.quantity, 0),
    };
  });

  const recentSales = [...demoState.sales]
    .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
    .slice(0, 5)
    .map(serializeSale);

  return { todaySummary, lowStockItems, recentTrend, recentSales };
}

function listSpools() {
  return demoState.spools.map(spool => {
    const usage = demoState.usageLogs.filter(entry => entry.spoolId === spool.id);
    const usedGramsTotal = usage.reduce((sum, entry) => sum + entry.usedGrams, 0);
    return {
      ...spool,
      usageCount: usage.length,
      usedGramsTotal,
    };
  });
}

function mockRequest(path, { method = 'GET', body } = {}) {
  const url = new URL(path, 'http://demo.local');
  const pathname = url.pathname;
  const payload = bodyToObject(body);
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === 'GET' && pathname === '/dashboard') {
    return clone(buildDashboard());
  }

  if (pathname === '/admin/reset' && normalizedMethod === 'POST') {
    demoState = createDemoState();
    return { ok: true };
  }

  if (pathname === '/items' && normalizedMethod === 'GET') {
    return clone(demoState.items.map(serializeItem));
  }

  if (pathname === '/items' && normalizedMethod === 'POST') {
    const item = {
      id: demoState.nextIds.item++,
      name: payload.name || 'Untitled Item',
      description: payload.description || '',
      price: asMoney(payload.price),
      quantity: asInt(payload.quantity),
      imagePath: null,
      defaultFilamentId: payload.defaultFilamentId ? Number(payload.defaultFilamentId) : null,
      tag: payload.tag || '',
    };
    demoState.items.unshift(item);
    return clone(serializeItem(item));
  }

  const itemMatch = pathname.match(/^\/items\/(\d+)$/);
  if (itemMatch && normalizedMethod === 'PUT') {
    const item = getItem(itemMatch[1]);
    if (!item) throw new Error('Item not found');
    item.name = payload.name ?? item.name;
    item.description = payload.description ?? item.description;
    item.price = payload.price != null ? asMoney(payload.price) : item.price;
    item.quantity = payload.quantity != null ? asInt(payload.quantity) : item.quantity;
    item.defaultFilamentId = payload.defaultFilamentId
      ? Number(payload.defaultFilamentId)
      : payload.defaultFilamentId === '' || payload.defaultFilamentId == null
        ? null
        : item.defaultFilamentId;
    item.tag = payload.tag ?? item.tag;
    return clone(serializeItem(item));
  }

  const adjustMatch = pathname.match(/^\/items\/(\d+)\/adjust$/);
  if (adjustMatch && normalizedMethod === 'POST') {
    const item = getItem(adjustMatch[1]);
    if (!item) throw new Error('Item not found');
    item.quantity = Math.max(0, item.quantity + asInt(payload.delta));
    return clone(serializeItem(item));
  }

  if (pathname === '/sessions' && normalizedMethod === 'GET') {
    return clone(
      [...demoState.sessions]
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .map(serializeSession),
    );
  }

  if (pathname === '/sessions' && normalizedMethod === 'POST') {
    const sessionDate = payload.sessionDate || dateOnly();
    const session = {
      id: demoState.nextIds.session++,
      title: payload.title || 'New Session',
      location: payload.location || '',
      sessionDate,
      weather: payload.weather || '',
      status: 'open',
      startedAt: nowIso(),
      endedAt: null,
    };
    demoState.sessions.unshift(session);
    return clone(serializeSession(session));
  }

  const sessionMatch = pathname.match(/^\/sessions\/(\d+)$/);
  if (sessionMatch && normalizedMethod === 'GET') {
    return clone(serializeSessionDetail(sessionMatch[1]));
  }

  const closeSessionMatch = pathname.match(/^\/sessions\/(\d+)\/close$/);
  if (closeSessionMatch && normalizedMethod === 'POST') {
    const session = demoState.sessions.find(entry => entry.id === Number(closeSessionMatch[1]));
    if (!session) throw new Error('Session not found');
    session.status = 'closed';
    session.endedAt = nowIso();
    return clone(serializeSession(session));
  }

  const sessionSalesMatch = pathname.match(/^\/sessions\/(\d+)\/sales$/);
  if (sessionSalesMatch && normalizedMethod === 'POST') {
    const sessionId = Number(sessionSalesMatch[1]);
    const item = getItem(payload.itemId);
    if (!item) throw new Error('Item not found');
    const quantity = Math.max(1, asInt(payload.quantity, 1));
    const unitPrice = payload.unitPrice != null ? asMoney(payload.unitPrice) : item.price;
    const totalPrice = unitPrice * quantity;
    const cashReceived =
      payload.paymentMethod === 'cash' && payload.cashReceived != null
        ? asMoney(payload.cashReceived)
        : null;
    const changeGiven =
      payload.paymentMethod === 'cash' && cashReceived != null
        ? Math.max(0, cashReceived - totalPrice)
        : null;

    const sale = {
      id: demoState.nextIds.sale++,
      sessionId,
      itemId: item.id,
      quantity,
      unitPrice,
      totalPrice,
      soldAt: payload.soldAt || nowIso(),
      note: payload.note || '',
      paymentMethod: payload.paymentMethod || 'card',
      cashReceived,
      changeGiven,
    };
    demoState.sales.unshift(sale);
    item.quantity = Math.max(0, item.quantity - quantity);
    return clone(serializeSale(sale));
  }

  if (pathname === '/custom-orders' && normalizedMethod === 'GET') {
    const status = url.searchParams.get('status');
    const orders = status
      ? demoState.customOrders.filter(order => order.status === status)
      : demoState.customOrders;
    return clone(orders);
  }

  if (pathname === '/custom-orders' && normalizedMethod === 'POST') {
    const order = {
      id: demoState.nextIds.customOrder++,
      customerName: payload.customerName || 'New Customer',
      contactInfo: payload.contactInfo || '',
      source: payload.source || 'other',
      status: payload.status || 'new',
      dueDate: payload.dueDate || '',
      requestDetails: payload.requestDetails || '',
      notes: payload.notes || '',
      quotedPrice: payload.quotedPrice != null ? asMoney(payload.quotedPrice) : null,
      depositPaid: payload.depositPaid != null ? asMoney(payload.depositPaid) : null,
      createdAt: nowIso(),
    };
    demoState.customOrders.unshift(order);
    return clone(order);
  }

  const customOrderMatch = pathname.match(/^\/custom-orders\/(\d+)$/);
  if (customOrderMatch && normalizedMethod === 'PUT') {
    const order = demoState.customOrders.find(entry => entry.id === Number(customOrderMatch[1]));
    if (!order) throw new Error('Custom order not found');
    Object.assign(order, {
      customerName: payload.customerName ?? order.customerName,
      contactInfo: payload.contactInfo ?? order.contactInfo,
      source: payload.source ?? order.source,
      status: payload.status ?? order.status,
      dueDate: payload.dueDate ?? order.dueDate,
      requestDetails: payload.requestDetails ?? order.requestDetails,
      notes: payload.notes ?? order.notes,
      quotedPrice: payload.quotedPrice != null ? asMoney(payload.quotedPrice) : order.quotedPrice,
      depositPaid: payload.depositPaid != null ? asMoney(payload.depositPaid) : order.depositPaid,
    });
    return clone(order);
  }

  if (pathname === '/filament/spools' && normalizedMethod === 'GET') {
    return clone(listSpools());
  }

  if (pathname === '/filament/spools' && normalizedMethod === 'POST') {
    const spool = {
      id: demoState.nextIds.spool++,
      material: payload.material || 'PLA',
      color: payload.color || '',
      brand: payload.brand || '',
      owner: payload.owner || '',
      dryness: payload.dryness || '',
      weightGrams: asInt(payload.weightGrams),
      remainingGrams:
        payload.remainingGrams != null ? asInt(payload.remainingGrams) : asInt(payload.weightGrams),
      cost: payload.cost != null ? asMoney(payload.cost) : null,
      purchaseDate: payload.purchaseDate || '',
      notes: payload.notes || '',
    };
    demoState.spools.unshift(spool);
    return clone({ ...spool, usageCount: 0, usedGramsTotal: 0 });
  }

  const spoolMatch = pathname.match(/^\/filament\/spools\/(\d+)$/);
  if (spoolMatch && normalizedMethod === 'PUT') {
    const spool = getSpool(spoolMatch[1]);
    if (!spool) throw new Error('Spool not found');
    Object.assign(spool, {
      material: payload.material ?? spool.material,
      color: payload.color ?? spool.color,
      brand: payload.brand ?? spool.brand,
      owner: payload.owner ?? spool.owner,
      dryness: payload.dryness ?? spool.dryness,
      weightGrams: payload.weightGrams != null ? asInt(payload.weightGrams) : spool.weightGrams,
      remainingGrams:
        payload.remainingGrams != null ? asInt(payload.remainingGrams) : spool.remainingGrams,
      cost: payload.cost != null ? asMoney(payload.cost) : spool.cost,
      purchaseDate: payload.purchaseDate ?? spool.purchaseDate,
      notes: payload.notes ?? spool.notes,
    });
    const usage = demoState.usageLogs.filter(entry => entry.spoolId === spool.id);
    return clone({
      ...spool,
      usageCount: usage.length,
      usedGramsTotal: usage.reduce((sum, entry) => sum + entry.usedGrams, 0),
    });
  }

  const spoolUsageMatch = pathname.match(/^\/filament\/spools\/(\d+)\/usage$/);
  if (spoolUsageMatch && normalizedMethod === 'GET') {
    const spoolId = Number(spoolUsageMatch[1]);
    return clone(
      demoState.usageLogs
        .filter(entry => entry.spoolId === spoolId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    );
  }

  if (spoolUsageMatch && normalizedMethod === 'POST') {
    const spoolId = Number(spoolUsageMatch[1]);
    const spool = getSpool(spoolId);
    if (!spool) throw new Error('Spool not found');
    const usedGrams = Math.max(0, asInt(payload.usedGrams));
    const usage = {
      id: demoState.nextIds.usage++,
      spoolId,
      usedGrams,
      reason: payload.reason || '',
      reference: payload.reference || '',
      createdAt: nowIso(),
    };
    demoState.usageLogs.unshift(usage);
    spool.remainingGrams = Math.max(0, spool.remainingGrams - usedGrams);
    return clone(usage);
  }

  if (pathname === '/print-queue' && normalizedMethod === 'GET') {
    const status = url.searchParams.get('status');
    const assignee = url.searchParams.get('assignee');
    const jobs = demoState.printJobs.filter(job => {
      if (status && job.status !== status) return false;
      if (assignee && job.assignee !== assignee) return false;
      return true;
    });
    return clone(
      jobs.map(job => ({
        ...job,
        filament: job.filamentSpoolId ? getSpool(job.filamentSpoolId) || null : null,
      })),
    );
  }

  if (pathname === '/print-queue' && normalizedMethod === 'POST') {
    const job = {
      id: demoState.nextIds.job++,
      itemName: payload.itemName || 'Untitled Job',
      filamentSpoolId: payload.filamentSpoolId ? Number(payload.filamentSpoolId) : null,
      quantity: Math.max(1, asInt(payload.quantity, 1)),
      assignee: payload.assignee || '',
      notes: payload.notes || '',
      modelUrl: payload.modelUrl || '',
      modelFilePath: null,
      status: payload.status || 'queued',
      priority: asInt(payload.priority, 0),
      dueDate: payload.dueDate || '',
      createdAt: nowIso(),
    };
    demoState.printJobs.unshift(job);
    return clone(job);
  }

  const printJobMatch = pathname.match(/^\/print-queue\/(\d+)$/);
  if (printJobMatch && normalizedMethod === 'PUT') {
    const job = demoState.printJobs.find(entry => entry.id === Number(printJobMatch[1]));
    if (!job) throw new Error('Print job not found');
    Object.assign(job, {
      itemName: payload.itemName ?? job.itemName,
      filamentSpoolId:
        payload.filamentSpoolId != null && payload.filamentSpoolId !== ''
          ? Number(payload.filamentSpoolId)
          : payload.filamentSpoolId === '' || payload.filamentSpoolId == null
            ? null
            : job.filamentSpoolId,
      quantity: payload.quantity != null ? Math.max(1, asInt(payload.quantity, 1)) : job.quantity,
      assignee: payload.assignee ?? job.assignee,
      notes: payload.notes ?? job.notes,
      modelUrl: payload.modelUrl ?? job.modelUrl,
      dueDate: payload.dueDate ?? job.dueDate,
      status: payload.status ?? job.status,
      priority: payload.priority != null ? asInt(payload.priority) : job.priority,
    });
    return clone(job);
  }

  if (printJobMatch && normalizedMethod === 'DELETE') {
    demoState.printJobs = demoState.printJobs.filter(entry => entry.id !== Number(printJobMatch[1]));
    return null;
  }

  if (pathname === '/expenses' && normalizedMethod === 'GET') {
    const payer = url.searchParams.get('payer');
    const assignee = url.searchParams.get('assignee');
    const category = url.searchParams.get('category');
    return clone(
      demoState.expenses.filter(expense => {
        if (payer && expense.payer !== payer) return false;
        if (assignee && expense.assignee !== assignee) return false;
        if (category && expense.category !== category) return false;
        return true;
      }),
    );
  }

  if (pathname === '/expenses' && normalizedMethod === 'POST') {
    const expense = {
      id: demoState.nextIds.expense++,
      description: payload.description || 'New Expense',
      amount: asMoney(payload.amount),
      category: payload.category || '',
      payer: payload.payer || 'Business',
      assignee: payload.assignee || '',
      expenseDate: payload.expenseDate || dateOnly(),
      notes: payload.notes || '',
    };
    demoState.expenses.unshift(expense);
    return clone(expense);
  }

  const expenseMatch = pathname.match(/^\/expenses\/(\d+)$/);
  if (expenseMatch && normalizedMethod === 'PUT') {
    const expense = demoState.expenses.find(entry => entry.id === Number(expenseMatch[1]));
    if (!expense) throw new Error('Expense not found');
    Object.assign(expense, {
      description: payload.description ?? expense.description,
      amount: payload.amount != null ? asMoney(payload.amount) : expense.amount,
      category: payload.category ?? expense.category,
      payer: payload.payer ?? expense.payer,
      assignee: payload.assignee ?? expense.assignee,
      expenseDate: payload.expenseDate ?? expense.expenseDate,
      notes: payload.notes ?? expense.notes,
    });
    return clone(expense);
  }

  if (expenseMatch && normalizedMethod === 'DELETE') {
    demoState.expenses = demoState.expenses.filter(entry => entry.id !== Number(expenseMatch[1]));
    return null;
  }

  throw new Error(`Demo API route not implemented: ${normalizedMethod} ${pathname}`);
}

async function request(path, { method = 'GET', body, headers, ...rest } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const options = {
    method,
    headers: {
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...rest,
  };

  if (body && !isFormData && options.headers['Content-Type'] === 'application/json') {
    options.body = JSON.stringify(body);
  } else if (body) {
    options.body = body;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (error) {
    if (useDemoFallback) {
      return mockRequest(path, { method, body });
    }
    throw error;
  }

  if (!response.ok) {
    if (useDemoFallback) {
      return mockRequest(path, { method, body });
    }
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data.message || message;
    } catch (err) {
      // ignore parse errors
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchDashboard() {
  return request('/dashboard');
}

export function fetchItems() {
  return request('/items');
}

export function fetchItem(id) {
  return request(`/items/${id}`);
}

export function createItem(payload) {
  return request('/items', { method: 'POST', body: payload });
}

export function updateItem(id, payload) {
  return request(`/items/${id}`, { method: 'PUT', body: payload });
}

export function adjustItemQuantity(id, payload) {
  return request(`/items/${id}/adjust`, { method: 'POST', body: payload });
}

export function fetchSessions() {
  return request('/sessions');
}

export function fetchSession(id) {
  return request(`/sessions/${id}`);
}

export function createSession(payload) {
  return request('/sessions', { method: 'POST', body: payload });
}

export function closeSession(id) {
  return request(`/sessions/${id}/close`, { method: 'POST' });
}

export function createSale(sessionId, payload) {
  return request(`/sessions/${sessionId}/sales`, { method: 'POST', body: payload });
}

export function fetchSessionSales(sessionId) {
  return request(`/sessions/${sessionId}/sales`);
}

export function resetDatabase() {
  return request('/admin/reset', { method: 'POST' });
}

export function fetchCustomOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status) {
    query.append('status', params.status);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/custom-orders${suffix}`);
}

export function createCustomOrder(payload) {
  return request('/custom-orders', { method: 'POST', body: payload });
}

export function updateCustomOrder(id, payload) {
  return request(`/custom-orders/${id}`, { method: 'PUT', body: payload });
}

export function fetchFilamentSpools() {
  return request('/filament/spools');
}

export function createFilamentSpool(payload) {
  return request('/filament/spools', { method: 'POST', body: payload });
}

export function updateFilamentSpool(id, payload) {
  return request(`/filament/spools/${id}`, { method: 'PUT', body: payload });
}

export function fetchFilamentUsage(spoolId) {
  return request(`/filament/spools/${spoolId}/usage`);
}

export function logFilamentUsage(spoolId, payload) {
  return request(`/filament/spools/${spoolId}/usage`, { method: 'POST', body: payload });
}

export function fetchPrintQueue(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.assignee) query.append('assignee', params.assignee);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/print-queue${suffix}`);
}

export function createPrintJob(payload, modelFile) {
  if (modelFile) {
    const form = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, value);
      }
    });
    form.append('modelFile', modelFile);
    return request('/print-queue', { method: 'POST', body: form });
  }
  return request('/print-queue', { method: 'POST', body: payload });
}

export function updatePrintJob(id, payload, modelFile) {
  if (modelFile) {
    const form = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, value);
      }
    });
    form.append('modelFile', modelFile);
    return request(`/print-queue/${id}`, { method: 'PUT', body: form });
  }
  return request(`/print-queue/${id}`, { method: 'PUT', body: payload });
}

export function deletePrintJob(id) {
  return request(`/print-queue/${id}`, { method: 'DELETE' });
}

export function fetchExpenses(params = {}) {
  const query = new URLSearchParams();
  if (params.payer) query.append('payer', params.payer);
  if (params.assignee) query.append('assignee', params.assignee);
  if (params.category) query.append('category', params.category);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/expenses${suffix}`);
}

export function createExpense(payload) {
  return request('/expenses', { method: 'POST', body: payload });
}

export function updateExpense(id, payload) {
  return request(`/expenses/${id}`, { method: 'PUT', body: payload });
}

export function deleteExpense(id) {
  return request(`/expenses/${id}`, { method: 'DELETE' });
}

export { API_BASE };
export { useDemoFallback };
