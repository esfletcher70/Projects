/* ============================================
   Small App Tools cookie consent banner
   ============================================ */

const STORAGE_KEY = 'sat-consent';

function applyConsent(granted) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied'
    });
}

function showBanner() {
    const banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.innerHTML = `
        <p>We use cookies to understand how visitors use this site. You can accept or decline analytics cookies.</p>
        <div class="consent-banner-actions">
            <button type="button" class="consent-btn decline">Decline</button>
            <button type="button" class="consent-btn accept">Accept</button>
        </div>
    `;
    document.body.appendChild(banner);

    banner.querySelector('.accept').addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEY, 'granted');
        applyConsent(true);
        banner.remove();
    });

    banner.querySelector('.decline').addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEY, 'denied');
        applyConsent(false);
        banner.remove();
    });
}

function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        showBanner();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
