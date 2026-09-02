import { apiUrl } from './apiConfig';

// Client-side Analytics Service
const SESSION_KEY = 'hb_session_id';

function getOrCreateSessionId(): string {
  try {
    let sess = sessionStorage.getItem(SESSION_KEY);
    if (!sess) {
      sess = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem(SESSION_KEY, sess);
    }
    return sess;
  } catch {
    return 'sess_fallback_' + Date.now();
  }
}

export function trackEvent(
  eventType: string,
  metadata?: Record<string, string | number | boolean | null>
) {
  try {
    const sessionId = getOrCreateSessionId();
    const token = localStorage.getItem('hb_auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fire and forget, fail silently so UI is never blocked
    fetch(apiUrl('/api/analytics/event'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventType,
        sessionId,
        metadata: metadata || {},
      }),
    }).catch(() => {
      // ignore network errors
    });
  } catch {
    // ignore
  }
}

// Track initial app open
if (typeof window !== 'undefined') {
  setTimeout(() => {
    trackEvent('app_open');
    trackEvent('session_start');
  }, 1000);
}
