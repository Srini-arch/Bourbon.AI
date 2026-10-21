/**
 * Bourbon.AI Unified API Configuration
 * Supports dynamic switching between local development, remote cloud APIs,
 * and GitHub Pages standalone client mode.
 */

export const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  
  // Custom API endpoint override via localStorage (e.g. ngrok tunnel)
  const customEndpoint = localStorage.getItem('bourbon_api_endpoint');
  if (customEndpoint && customEndpoint.trim()) {
    return customEndpoint.trim().replace(/\/$/, '');
  }

  // Vite local development server
  if (window.location.port === '5173') {
    return 'http://localhost:8000';
  }

  // GitHub Pages default behavior
  if (window.location.hostname.includes('github.io')) {
    const remote = localStorage.getItem('bourbon_remote_api');
    return remote ? remote.replace(/\/$/, '') : '';
  }

  // Standard same-origin production hosting (FastAPI serving dist bundle)
  return '';
};

export const setApiBase = (url) => {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('bourbon_api_endpoint');
  } else {
    localStorage.setItem('bourbon_api_endpoint', url.trim().replace(/\/$/, ''));
  }
};

export const API_BASE = getApiBase();

export default API_BASE;
