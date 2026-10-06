// Empty for a single deployment (same origin). Set VITE_API_URL when the API lives on another domain.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/** Prefixes server-relative asset URLs (product images, avatars) with the API origin when needed. */
export const assetUrl = (path) => (path && path.startsWith('/api/') ? `${API_BASE}${path}` : path || '');

// Sessions are httpOnly cookies now. Remove tokens left in storage by older versions.
try {
  localStorage.removeItem('novara.token');
  sessionStorage.removeItem('novara.token');
} catch {
  /* storage unavailable */
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

export const OFFLINE_MESSAGE = 'The Novara server is not responding right now. It may be restarting, please try again in a few seconds.';

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(path, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(`/api${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  // The custom header is the API's CSRF check: cross-site pages cannot send it
  const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${url.pathname}${url.search}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      credentials: API_BASE ? 'include' : 'same-origin',
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, OFFLINE_MESSAGE);
  }

  let data = null;
  const text = await res.text();
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  if (text && isJson) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  // Gateway errors or HTML/plain responses mean the API is not reachable (restarting or down)
  if ([502, 503, 504].includes(res.status) || (!res.ok && !data)) {
    throw new ApiError(res.status || 0, OFFLINE_MESSAGE);
  }

  if (!res.ok) {
    // An expired or revoked session anywhere in the app signs the user out (login failures excluded)
    if (res.status === 401 && onUnauthorized && !path.startsWith('/auth/')) onUnauthorized();
    throw new ApiError(res.status, data?.message || `Request failed (${res.status})`, data?.details);
  }
  return data;
}
