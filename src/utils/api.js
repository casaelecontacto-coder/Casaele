// Use VITE_API_BASE_URL if set, otherwise default to production backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://amrit-project-lms.onrender.com';

// localStorage's `authToken` is kept in sync by App.jsx's onIdTokenChanged
// listener, but that only fires when Firebase decides to refresh — if the
// tab sat idle/backgrounded a while, the cached copy can go stale (Firebase
// ID tokens expire after 1hr) well before that listener notices, and a
// request built from it fails admin auth with a generic "Authentication
// failed". Raw-fetch upload handlers that build their own Authorization
// header (they can't use apiGet/apiSend, since those don't send FormData
// the way file uploads need) should call this instead of reading
// localStorage directly — it asks Firebase for the current token, which
// transparently refreshes if it's expired, and re-syncs localStorage too.
// Falls back to the possibly-stale cached value if Firebase's own current
// user isn't available yet (e.g. this fires before the SDK rehydrates).
export async function getFreshAuthToken() {
  try {
    const { auth } = await import('../firebase');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (typeof window !== 'undefined') localStorage.setItem('authToken', token);
      return token;
    }
  } catch (e) {
    console.error('Failed to refresh auth token:', e);
  }
  return typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
}

export async function apiGet(path) {
  const token = await getFreshAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Admin data-fetching requests should bypass browser cache
  const isAdminRequest = path.includes('all=true') || path.endsWith('/admin');

  try {
    // For admin requests, append a timestamp to bust browser/CDN cache
    const url = isAdminRequest
      ? `${API_BASE}${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`
      : `${API_BASE}${path}`;
    const res = await fetch(url, { headers, cache: isAdminRequest ? 'no-store' : 'default' });
    if (!res.ok) {
      // Silently handle 404s for CMS content (fallback content will be used)
      if (res.status === 404 && path.includes('/api/cms/slug/')) {
        throw new Error('NOT_FOUND');
      }
      const text = await res.text().catch(() => '');
      throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  } catch (error) {
    // Re-throw the error for handling by the component
    throw error;
  }
}

export async function apiSend(path, method, body) {
  const token = await getFreshAuthToken();

  const headers = {};
  let payload = body;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Check if the body is NOT a FormData instance (i.e., it's a regular JSON payload)
  if (!(body instanceof FormData)) {
    // For JSON payloads, set Content-Type and stringify the body
    headers['Content-Type'] = 'application/json';
    payload = body ? JSON.stringify(body) : undefined;
  } 
  // If it is FormData (for file uploads), the browser automatically sets the correct 
  // 'Content-Type: multipart/form-data' header with the necessary boundary.
  
  const res = await fetch(`${API_BASE}${path}`, { 
    method, 
    headers, 
    body: payload 
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}