const isBrowser = typeof window !== 'undefined';

// Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues on some systems
let defaultApiUrl = "http://127.0.0.1:8000";

if (isBrowser) {
  // If we're on localhost, use 127.0.0.1 for the API
  const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  defaultApiUrl = `${window.location.protocol}//${hostname}:8000`;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export default API_BASE_URL;
