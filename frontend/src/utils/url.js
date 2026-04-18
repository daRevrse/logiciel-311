/**
 * Resolves an image URL by prepending the API base URL if the path is relative.
 * @param {string} path - The image path or URL.
 * @returns {string|null} - The resolved URL.
 */
export const resolveImageUrl = (path) => {
  if (!path) return null;
  
  // Return early if it's already an absolute URL, a blob URL, or a data URI
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  // Get the base API URL and strip the trailing /api to get the server root
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverUrl = apiUrl.replace(/\/api\/?$/, '');
  
  // Ensure the server URL and the path are joined correctly
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${serverUrl}${normalizedPath}`;
};
