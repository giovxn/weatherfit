const AUTH_BASE = '/api/auth';
const TOKEN_KEY = 'weatherfit_access_token';

function jsonHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function registerUser(payload) {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Registration failed');
  }
  return res.json();
}

export async function loginUser(payload) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Login failed');
  }
  return res.json();
}

export async function loginWithGoogle(idToken) {
  const res = await fetch(`${AUTH_BASE}/google`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ id_token: idToken })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Google login failed');
  }
  return res.json();
}

export async function fetchCurrentUser(token) {
  const res = await fetch(`${AUTH_BASE}/me`, {
    method: 'GET',
    headers: jsonHeaders(token)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Unable to fetch current user');
  }
  return res.json();
}

export async function fetchItems(token) {
  const res = await fetch('/api/items', {
    method: 'GET',
    headers: jsonHeaders(token)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Unable to fetch items');
  }
  return res.json();
}

export async function createItem(token, payload) {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Unable to create item');
  }
  return res.json();
}

export async function deleteItemById(token, itemId) {
  const res = await fetch(`/api/items/${itemId}`, {
    method: 'DELETE',
    headers: jsonHeaders(token)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Unable to delete item');
  }
}
