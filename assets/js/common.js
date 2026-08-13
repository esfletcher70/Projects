/* ============================================
   AppHub shared utilities
   ============================================ */

function formatCurrency(value, fractionDigits = 0) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    }).format(value);
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError() {
    const errorDiv = document.getElementById('error');
    if (!errorDiv) return;
    errorDiv.classList.remove('show');
}

function showSuccess(message) {
    const successDiv = document.getElementById('success');
    if (!successDiv) return;
    successDiv.textContent = message;
    successDiv.classList.add('show');
    setTimeout(hideSuccess, 3000);
}

function hideSuccess() {
    const successDiv = document.getElementById('success');
    if (!successDiv) return;
    successDiv.classList.remove('show');
}

function copyCode(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        showError('Failed to copy. Please try again.');
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFormatFromMime(mime) {
    const formats = {
        'image/jpeg': 'JPEG',
        'image/png': 'PNG',
        'image/webp': 'WebP'
    };
    return formats[mime] || 'Unknown';
}

function getExtensionFromMime(mime) {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
    };
    return extensions[mime] || 'jpg';
}
