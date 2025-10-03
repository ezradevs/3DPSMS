import Constants from 'expo-constants';

const DEFAULT_BASE_URL = 'http://localhost:4000/api';

function resolveBaseUrl() {
  const fromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  return fromConfig && typeof fromConfig === 'string' ? fromConfig : DEFAULT_BASE_URL;
}

const API_BASE_URL = resolveBaseUrl();

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

  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch (error) {
      // response body not JSON – ignore
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getDashboard() {
  return request('/dashboard');
}

export function getItems() {
  return request('/items');
}

export function getSessions() {
  return request('/sessions');
}

export function getSession(sessionId) {
  return request(`/sessions/${sessionId}`);
}

export function createSession(payload) {
  return request('/sessions', { method: 'POST', body: payload });
}

export function createSale(sessionId, payload) {
  return request(`/sessions/${sessionId}/sales`, { method: 'POST', body: payload });
}

export function closeSession(sessionId) {
  return request(`/sessions/${sessionId}/close`, { method: 'POST' });
}

export function resetDatabase() {
  return request('/admin/reset', { method: 'POST' });
}

export const api = {
  getDashboard,
  getItems,
  getSessions,
  getSession,
  createSession,
  createSale,
  closeSession,
  resetDatabase,
  baseUrl: API_BASE_URL,
};
