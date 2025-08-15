// Configuration utilities
export const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8801';
};

// You can add other config functions here later
export const getApiConfig = () => ({
  baseURL: getBaseUrl(),
  withCredentials: true
});
