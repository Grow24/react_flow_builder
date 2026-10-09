const configured = import.meta.env.VITE_API_ORIGIN as string | undefined;

export const API_ORIGIN = (configured || 'http://localhost:3001').replace(/\/$/, '');
export const API_BASE = `${API_ORIGIN}/api`;
