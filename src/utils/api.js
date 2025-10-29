// Use VITE_API_BASE_URL if set, otherwise default to production backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://amrit-project-lms.onrender.com';

export async function apiGet(path) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers });
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
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