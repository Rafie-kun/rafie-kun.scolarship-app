// In Tauri desktop builds, the frontend is served from tauri://localhost,
// so relative /api/* would 404. Point it at the hosted API instead.
export const API_BASE =
  typeof window !== 'undefined' && (window as any).__TAURI__
    ? 'https://rafie-kun-scolarship-app.vercel.app'
    : '';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${API_BASE}${path}`;
}
