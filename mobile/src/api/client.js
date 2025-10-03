import Constants from 'expo-constants';

const DEFAULT_BASE_URL = 'http://localhost:4000/api';

function resolveBaseUrl() {
  const fromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  return typeof fromConfig === 'string' && fromConfig.length ? fromConfig : DEFAULT_BASE_URL;
}

const API_BASE_URL = resolveBaseUrl();
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveUploadUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return `${API_ORIGIN}/${trimmed}`;
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, value);
    }
  });
  const queryString = qs.toString();
  return queryString ? `?${queryString}` : '';
}

async function request(path, { method = 'GET', body, headers, ...rest } = {}) {
  const isMultipart = isFormData(body);
  const options = {
    method,
    headers: {
      ...(body && !isMultipart ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...rest,
  };

  if (body) {
    options.body = !isMultipart && options.headers['Content-Type'] === 'application/json'
      ? JSON.stringify(body)
      : body;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch (err) {
      // ignore parse errors
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

// Dashboard
export function getDashboard() {
  return request('/dashboard');
}

// Inventory
export function getItems() {
  return request('/items');
}

export function getItem(itemId) {
  return request(`/items/${itemId}`);
}

export function createItem(payload) {
  return request('/items', { method: 'POST', body: payload });
}

export function updateItem(itemId, payload) {
  return request(`/items/${itemId}`, { method: 'PUT', body: payload });
}

export function adjustItemQuantity(itemId, body) {
  return request(`/items/${itemId}/adjust`, { method: 'POST', body });
}

// Sessions & sales
export function getSessions() {
  return request('/sessions');
}

export function getSession(sessionId) {
  return request(`/sessions/${sessionId}`);
}

export function createSession(body) {
  return request('/sessions', { method: 'POST', body });
}

export function closeSession(sessionId) {
  return request(`/sessions/${sessionId}/close`, { method: 'POST' });
}

export function createSale(sessionId, body) {
  return request(`/sessions/${sessionId}/sales`, { method: 'POST', body });
}

// Custom orders
export function listCustomOrders(params = {}) {
  return request(`/custom-orders${buildQuery(params)}`);
}

export function getCustomOrder(id) {
  return request(`/custom-orders/${id}`);
}

export function createCustomOrder(body) {
  return request('/custom-orders', { method: 'POST', body });
}

export function updateCustomOrder(id, body) {
  return request(`/custom-orders/${id}`, { method: 'PUT', body });
}

// Filament
export function listFilamentSpools() {
  return request('/filament/spools');
}

export function getFilamentSpool(id) {
  return request(`/filament/spools/${id}`);
}

export function createFilamentSpool(body) {
  return request('/filament/spools', { method: 'POST', body });
}

export function updateFilamentSpool(id, body) {
  return request(`/filament/spools/${id}`, { method: 'PUT', body });
}

export function listFilamentUsage(id) {
  return request(`/filament/spools/${id}/usage`);
}

export function logFilamentUsage(id, body) {
  return request(`/filament/spools/${id}/usage`, { method: 'POST', body });
}

// Print queue
export function listPrintJobs(params = {}) {
  return request(`/print-queue${buildQuery(params)}`);
}

export function createPrintJob(body) {
  return request('/print-queue', { method: 'POST', body });
}

export function updatePrintJob(id, body) {
  return request(`/print-queue/${id}`, { method: 'PUT', body });
}

export function deletePrintJob(id) {
  return request(`/print-queue/${id}`, { method: 'DELETE' });
}

// Expenses
export function listExpenses(params = {}) {
  return request(`/expenses${buildQuery(params)}`);
}

export function createExpense(body) {
  return request('/expenses', { method: 'POST', body });
}

export function updateExpense(id, body) {
  return request(`/expenses/${id}`, { method: 'PUT', body });
}

export function deleteExpense(id) {
  return request(`/expenses/${id}`, { method: 'DELETE' });
}

// Admin
export function resetDatabase() {
  return request('/admin/reset', { method: 'POST' });
}

export const api = {
  baseUrl: API_BASE_URL,
  getDashboard,
  getItems,
  getItem,
  createItem,
  updateItem,
  adjustItemQuantity,
  getSessions,
  getSession,
  createSession,
  closeSession,
  createSale,
  listCustomOrders,
  getCustomOrder,
  createCustomOrder,
  updateCustomOrder,
  listFilamentSpools,
  getFilamentSpool,
  createFilamentSpool,
  updateFilamentSpool,
  listFilamentUsage,
  logFilamentUsage,
  listPrintJobs,
  createPrintJob,
  updatePrintJob,
  deletePrintJob,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  resetDatabase,
};
