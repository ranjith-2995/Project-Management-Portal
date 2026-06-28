const DEFAULT_LOCAL_API = 'http://localhost:5000/api';
const PROD_BACKEND_API = 'https://project-management-portal-ka8q.onrender.com/api';

export function resolveApiBaseUrl(env = import.meta.env, hostname) {
  if (env?.VITE_API_URL) {
    return env.VITE_API_URL.replace(/\/$/, '');
  }

  const currentHostname = hostname || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');

  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1' || currentHostname === '::1') {
    return DEFAULT_LOCAL_API;
  }

  return PROD_BACKEND_API;
}

export const API_BASE_URL = resolveApiBaseUrl();
