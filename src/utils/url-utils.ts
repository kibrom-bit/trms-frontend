/**
 * Consistent utility for mapping backend asset paths to full URLs.
 * Handles both development and relative path scenarios.
 */
export const getBackendUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  
  // If it's already a full URL or a data URI, return as is
  if (path.startsWith('data:')) {
    return path;
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '');
  const origin = (() => {
    try {
      return new URL(apiBase).origin;
    } catch {
      return 'http://localhost:3000';
    }
  })();

  // Rewrite legacy stored localhost URLs to current backend origin to avoid mixed-content.
  if (path.startsWith('http://localhost:3000') || path.startsWith('https://localhost:3000')) {
    const relative = path.replace(/^https?:\/\/localhost:3000/, '');
    return `${origin}${relative.startsWith('/') ? '' : '/'}${relative}`;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Use configured backend origin for assets (works in prod and dev).
  return `${origin}${cleanPath}`;
};
