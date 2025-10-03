const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

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

  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
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
