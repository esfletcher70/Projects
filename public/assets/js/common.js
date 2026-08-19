/* ============================================
   Small App Tools shared utilities (ES module)
   ============================================ */

export function formatCurrency(value, fractionDigits = 0) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    }).format(value);
}

export function showError(message, container = document) {
    const errorDiv = container.querySelector('.tool-alert.error') || document.getElementById('error');
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

export function hideError(container = document) {
    const errorDiv = container.querySelector('.tool-alert.error') || document.getElementById('error');
    if (!errorDiv) return;
    errorDiv.classList.remove('show');
}

export function showSuccess(message, container = document) {
    const successDiv = container.querySelector('.tool-alert.success') || document.getElementById('success');
    if (!successDiv) return;
    successDiv.textContent = message;
    successDiv.classList.add('show');
    setTimeout(() => hideSuccess(container), 3000);
}

export function requireValid(condition, message, container) {
    if (condition) return true;
    showError(message, container);
    return false;
}

export function hideSuccess(container = document) {
    const successDiv = container.querySelector('.tool-alert.success') || document.getElementById('success');
    if (!successDiv) return;
    successDiv.classList.remove('show');
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFormatFromMime(mime) {
    const formats = {
        'image/jpeg': 'JPEG',
        'image/png': 'PNG',
        'image/webp': 'WebP'
    };
    return formats[mime] || 'Unknown';
}

export function getExtensionFromMime(mime) {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
    };
    return extensions[mime] || 'jpg';
}

export function qs(container, selector) {
    return container.querySelector(selector);
}
