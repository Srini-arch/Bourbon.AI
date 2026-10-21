/**
 * Autonomous Client-Side Activity & Telemetry Logger for Bourbon.AI Studio
 * Logs logins, tab navigations, KYC updates, and AI actions.
 * Persists locally in localStorage AND provides instant JSON export/import.
 */

const LOG_STORAGE_KEY = 'bourbon_telemetry_logs_v1';
const MAX_LOG_ENTRIES = 200;

export function getTelemetryLogs() {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse telemetry logs:', e);
    return [];
  }
}

export function logActivity(category, action, details = {}) {
  try {
    const now = new Date();
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: now.toISOString(),
      display_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: now.toLocaleDateString(),
      category: category, // 'AUTH', 'NAVIGATION', 'KYC', 'STUDIO', 'SYSTEM'
      action: action,
      user: localStorage.getItem('bourbon_username') || 'admin',
      client: localStorage.getItem('bourbon_client') || 'Unbox-ED',
      details: details,
      url: window.location.href
    };

    const logs = getTelemetryLogs();
    logs.unshift(entry); // newest first

    if (logs.length > MAX_LOG_ENTRIES) {
      logs.length = MAX_LOG_ENTRIES;
    }

    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));

    // Also dispatch a custom event so in-browser components can listen in real-time
    window.dispatchEvent(new CustomEvent('bourbon_log_event', { detail: entry }));
    return entry;
  } catch (err) {
    console.error('Logging failed:', err);
    return null;
  }
}

export function exportLogsAsFile() {
  const logs = getTelemetryLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bourbon_telemetry_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function clearTelemetryLogs() {
  try {
    localStorage.removeItem(LOG_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('bourbon_log_event', { detail: { action: 'CLEARED' } }));
  } catch (_) {}
}
