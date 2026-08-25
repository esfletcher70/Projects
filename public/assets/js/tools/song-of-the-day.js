/* ============================================
   Small App Tools Song of the Day (tool module)
   ============================================ */

import { showError, hideError, qs } from '../common.js';

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

// Only allow http(s) URLs from the API into src/href attributes, and
// escape them so a crafted value can't break out of the attribute.
function safeUrl(url) {
    if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return '';
    return escapeHtml(url);
}

export function mount(container) {
    container.innerHTML = `
        <div class="tool-alert error"></div>
        <div class="tool-section">
            <div id="loading">Loading today's song...</div>
            <div data-song-content></div>
        </div>
    `;

    const loadingDiv = qs(container, '#loading');
    const content = qs(container, '[data-song-content]');
    let audioEl = null;

    function setLoading(isLoading) {
        loadingDiv.style.display = isLoading ? 'block' : 'none';
    }

    function renderSong(song) {
        content.innerHTML = `
            ${song.album_image && safeUrl(song.album_image) ? `<img class="song-image" src="${safeUrl(song.album_image)}" alt="${escapeHtml(song.album_name || 'Album art')}" loading="lazy" referrerpolicy="no-referrer">` : ''}
            <div class="result-block">
                <div class="result-label">Song of the Day</div>
                <div class="result-value song-title">${escapeHtml(song.name || 'Untitled')}</div>
                ${song.artist_name ? `<div class="song-artist">${escapeHtml(song.artist_name)}</div>` : ''}
                ${song.album_name ? `<div class="song-album">${escapeHtml(song.album_name)}</div>` : ''}
                ${safeUrl(song.audio) ? `<audio class="song-audio" controls src="${safeUrl(song.audio)}"></audio>` : ''}
                ${safeUrl(song.license_ccurl) ? `<a class="song-link" href="${safeUrl(song.license_ccurl)}" target="_blank" rel="noopener noreferrer">License & credit →</a>` : ''}
                ${safeUrl(song.shareurl) ? `<a class="song-link" href="${safeUrl(song.shareurl)}" target="_blank" rel="noopener noreferrer">View on Jamendo →</a>` : ''}
            </div>
        `;
        audioEl = content.querySelector('.song-audio');
    }

    async function loadSong() {
        try {
            setLoading(true);
            hideError(container);
            content.innerHTML = '';

            const response = await fetch('/api/jamendo');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Unable to load today's song.");
            }

            renderSong(data);
        } catch (err) {
            showError(err.message || "Unable to load today's song.", container);
        } finally {
            setLoading(false);
        }
    }

    loadSong();

    return function unmount() {
        if (audioEl) audioEl.pause();
    };
}
