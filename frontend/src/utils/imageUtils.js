/**
 * Universal Image Formatting Utility for Neuron
 * Prevents broken image errors by properly detecting data URIs, HTTP URLs,
 * and raw base64 JPEG strings (which often start with '/9j/').
 */

export const formatImageSrc = (img) => {
    if (!img || typeof img !== 'string') return null;
    const trimmed = img.trim();
    if (!trimmed) return null;

    // Already a complete Data URI or standard URL
    if (
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }

    // JPEG base64 strings commonly start with '/9j/'.
    // If it starts with '/9j/' or has no slashes or is long (> 100 chars),
    // it is a base64 encoded image string that needs data:image/jpeg;base64, prefix.
    if (trimmed.startsWith('/9j/') || !trimmed.startsWith('/') || trimmed.length > 100) {
        return `data:image/jpeg;base64,${trimmed}`;
    }

    return trimmed;
};

export const handleImageError = (e, fallbackElementId = null) => {
    if (e && e.currentTarget) {
        e.currentTarget.style.display = 'none';
        if (e.currentTarget.nextElementSibling) {
            e.currentTarget.nextElementSibling.style.display = 'flex';
        }
        if (fallbackElementId) {
            const el = document.getElementById(fallbackElementId);
            if (el) el.style.display = 'flex';
        }
    }
};
