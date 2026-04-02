/**
 * Consistent utility for mapping backend asset paths to full URLs.
 * Handles both development and relative path scenarios.
 */
export const getBackendUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  
  // If it's already a full URL or a data URI, return as is
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Default to localhost:3000 for development images
  return `http://localhost:3000${cleanPath}`;
};
