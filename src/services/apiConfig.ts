import { Capacitor } from '@capacitor/core';

// In standard Web Browser environment, requests use same-origin relative URLs ('')
// In Capacitor native mobile environment (Android / iOS), requests use VITE_API_BASE_URL with fallback to live production URL
export const DEFAULT_API_BASE_URL =
  'https://ais-pre-vs6btqtoocmqezm6r4nfuv-676651388195.europe-west2.run.app';

/**
 * Robustly detects if the app is currently executing inside a native mobile runtime
 * (such as an Android APK / Capacitor WebView) vs. a standard web browser.
 */
export function isNativeMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof Capacitor !== 'undefined') {
      if (typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
        return true;
      }
      if (typeof Capacitor.getPlatform === 'function') {
        const platform = Capacitor.getPlatform();
        if (platform === 'android' || platform === 'ios') {
          return true;
        }
      }
    }
  } catch {
    // Ignore error
  }

  const protocol = window.location.protocol;
  if (protocol === 'capacitor:' || protocol === 'ionic:' || protocol === 'file:') {
    return true;
  }

  return false;
}

/**
 * Returns the base URL for API and backend resource requests.
 * - In standard Web Browser environment, requests MUST always use same-origin relative URLs ('')
 *   to avoid cross-origin redirection/CORS blocks and work seamlessly in dev, preview, and production.
 * - In Capacitor native mobile environment (Android / iOS / WebView), uses VITE_API_BASE_URL
 *   or falls back to DEFAULT_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (envBaseUrl && typeof envBaseUrl === 'string' && envBaseUrl.trim()) {
    return envBaseUrl.trim().replace(/\/+$/, '');
  }

  // Web Browser Mode: Default to relative URLs ('') so requests route directly to the current host
  // (/api/auth/login, /api/bibles, etc.) with zero CORS issues on Vercel and Express fullstack.
  if (!isNativeMobileApp()) {
    return '';
  }

  // Capacitor Native Mobile Mode fallback (Android APK / iOS app):
  return DEFAULT_API_BASE_URL;
}

/**
 * Builds a full API or backend resource URL from a path.
 * Example: apiUrl('/api/bibles') -> 'https://ais-pre-vs6btqtoocmqezm6r4nfuv-676651388195.europe-west2.run.app/api/bibles' on Android,
 * or '/api/bibles' in standard browser mode.
 */
export function apiUrl(path: string): string {
  if (!path) return '';
  // If already absolute HTTP(S) URL, return as is
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

/**
 * Resolves avatar image URLs (including uploaded /api/uploads/avatars/ paths)
 * to full live backend URLs when running inside Capacitor or Android.
 */
export function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  const trimmed = avatarUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }
  return apiUrl(trimmed);
}

/**
 * Safe client-side diagnostic report for debugging network and platform bindings.
 * Exposes NO secrets, keys, passwords, or tokens.
 */
export function getSafeDiagnostics(): {
  platform: string;
  isNative: boolean;
  resolvedApiBaseUrl: string;
  protocol: string;
  host: string;
} {
  return {
    platform: typeof Capacitor !== 'undefined' ? Capacitor.getPlatform() : 'unknown',
    isNative: isNativeMobileApp(),
    resolvedApiBaseUrl: getApiBaseUrl() || '(same-origin relative)',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'server',
    host: typeof window !== 'undefined' ? window.location.host : 'server',
  };
}

if (typeof window !== 'undefined') {
  (window as unknown as { __HB_DIAGNOSTICS__?: () => unknown }).__HB_DIAGNOSTICS__ = getSafeDiagnostics;
}
