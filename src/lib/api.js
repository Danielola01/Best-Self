/**
 * API Utility for handling base URLs across web and mobile platforms
 */
export const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  // Clean up paths to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If we have a base URL, use it. Otherwise, assume we're on web and use relative paths.
  if (baseUrl) {
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${cleanPath}`;
  }
  
  return cleanPath;
};
