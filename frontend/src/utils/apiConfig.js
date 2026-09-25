// Unified API Configuration for Neuron Frontend
// Priority:
// 1. Persisted URL in localStorage (so user never has to reconnect manually)
// 2. Vite environment variable VITE_API_BASE (baked into production build)
// 3. Default fallback: http://localhost:8000/api/v1

const DEFAULT_FALLBACK = "http://localhost:8000/api/v1";

export const formatApiUrl = (url) => {
    if (!url) return DEFAULT_FALLBACK;
    let clean = url.trim();
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    if (!clean.endsWith('/api/v1')) {
        clean = `${clean}/api/v1`;
    }
    return clean;
};

export const getApiBase = () => {
    const envBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL;

    try {
        const saved = localStorage.getItem('neuron_api_base');
        if (saved && saved.trim()) {
            // Purge outdated or non-existent domains
            if (saved.includes('api.neuron.com') || saved.includes('trycloudflare.com')) {
                localStorage.removeItem('neuron_api_base');
            } else {
                return formatApiUrl(saved);
            }
        }
    } catch (e) {
        console.warn("Could not read localStorage for apiBase", e);
    }

    if (envBase && envBase.trim()) {
        return formatApiUrl(envBase);
    }

    return DEFAULT_FALLBACK;
};

export const setApiBase = (url) => {
    try {
        if (!url) {
            localStorage.removeItem('neuron_api_base');
            return DEFAULT_FALLBACK;
        }
        const formatted = formatApiUrl(url);
        localStorage.setItem('neuron_api_base', formatted);
        return formatted;
    } catch (e) {
        console.warn("Could not save apiBase to localStorage", e);
        return formatApiUrl(url);
    }
};
