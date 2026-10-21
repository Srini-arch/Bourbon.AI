/**
 * Bourbon.AI Unified API Configuration
 * Supports dynamic switching between local development, remote cloud APIs,
 * and GitHub Pages standalone client mode.
 */

const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  
  // Custom API endpoint override via localStorage (useful for testers on GitHub Pages)
  const customEndpoint = localStorage.getItem('bourbon_api_endpoint');
  if (customEndpoint) return customEndpoint.replace(/\/$/, '');

  // Vite local development server
  if (window.location.port === '5173') {
    return 'http://localhost:8000';
  }

  // GitHub Pages or external web host
  if (window.location.hostname.includes('github.io')) {
    // If running on GitHub Pages, fallback to default backend or current origin if proxied
    return localStorage.getItem('bourbon_remote_api') || 'http://localhost:8000';
  }

  // Standard same-origin production hosting (FastAPI serving dist bundle)
  return '';
};

export const API_BASE = getApiBase();

export default API_BASE;
