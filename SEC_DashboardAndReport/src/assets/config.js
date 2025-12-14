window.__env = window.__env || {};
// Set at deploy-time in Cloud Run via entrypoint; fallback is empty for dev (proxy)
window.__env.apiUrl = window.__env.apiUrl || '';
window.__env.signalRHubUrl = window.__env.signalRHubUrl || '';
window.__env.production = window.__env.production || '';


