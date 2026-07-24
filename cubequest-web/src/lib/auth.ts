
const AUTH_KEY = 'cq-auth';

interface AuthData {
  token: string;
  refreshToken: string;
  user: { id: string; role: string; nickname: string; avatarUrl?: string; birthYear?: number; city?: string; phone?: string; email?: string; createdAt?: string };
}

function isBrowser() { return typeof window !== 'undefined'; }

export function getAuth(): AuthData | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setAuth(data: AuthData) {
  if (!isBrowser()) return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  localStorage.setItem('accessToken', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
}

export function clearAuth() {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('cubequest-auth');
  localStorage.removeItem('cubequest-user');
  window.location.href = '/';
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  const auth = getAuth();
  if (auth) return auth.token;
  return localStorage.getItem('accessToken');
}

// React hook-friendly event emitter for auth changes
type Listener = () => void;
let listeners: Listener[] = [];
export function onAuthChange(fn: Listener) { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn); }; }
export function emitAuthChange() { listeners.forEach(fn => fn()); }
