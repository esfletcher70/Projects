/* ============================================
   Small App Tools Art Piece of the Day (tool module)
   ============================================ */

import { showError, hideError, qs } from '../common.js';

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

export function mount(container) {
    container.innerHTML = `
        <div class="tool-alert error"></div>
        <div class="tool-section">
            <div id="loading">Loading today's artwork...</div>
            <div data-art-content></div>
        </div>
    `;

    const loadingDiv = qs(container, '#loading');
    const content = qs(container, '[data-art-content]');

    function setLoading(isLoading) {
        loadingDiv.style.display = isLoading ? 'block' : 'none';
    }

    function renderArtwork(art) {
        const imageUrl = `https://www.artic.edu/iiif/2/${art.image_id}/full/843,/0/default.jpg`;
        const artworkUrl = `https://www.artic.edu/artworks/${art.id}`;

        content.innerHTML = `
            <img class="art-image" src="${imageUrl}" alt="${escapeHtml(art.title || 'Artwork of the day')}" loading="lazy" referrerpolicy="no-referrer">
            <div class="result-block">
                <div class="result-label">Art Piece of the Day</div>
                <div class="result-value art-title">${escapeHtml(art.title || 'Untitled')}</div>
                ${art.artist_display ? `<div class="art-artist">${escapeHtml(art.artist_display)}</div>` : ''}
                ${art.date_display ? `<div class="art-date">${escapeHtml(art.date_display)}</div>` : ''}
                ${art.credit_line ? `<div class="art-credit">${escapeHtml(art.credit_line)}</div>` : ''}
                <a class="art-link" href="${artworkUrl}" target="_blank" rel="noopener noreferrer">View on artic.edu →</a>
            </div>
        `;
    }

    async function loadArtwork() {
        try {
            setLoading(true);
            hideError(container);
            content.innerHTML = '';

            const response = await fetch('/api/artic');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Unable to load today's artwork.");
            }

            renderArtwork(data);
        } catch (err) {
            showError(err.message || "Unable to load today's artwork.", container);
        } finally {
            setLoading(false);
        }
    }

    loadArtwork();

    return function unmount() {};
}
