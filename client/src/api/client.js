const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('logitrack_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido: limpiar sesión si no estamos en login/register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          localStorage.removeItem('logitrack_token');
          localStorage.removeItem('logitrack_user');
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || `Error en la solicitud HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
};

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
