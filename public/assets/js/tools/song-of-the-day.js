/* ============================================
   Small App Tools Song of the Day (tool module)
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
            ${song.album_image ? `<img class="song-image" src="${song.album_image}" alt="${escapeHtml(song.album_name || 'Album art')}" loading="lazy" referrerpolicy="no-referrer">` : ''}
            <div class="result-block">
                <div class="result-label">Song of the Day</div>
                <div class="result-value song-title">${escapeHtml(song.name || 'Untitled')}</div>
                ${song.artist_name ? `<div class="song-artist">${escapeHtml(song.artist_name)}</div>` : ''}
                ${song.album_name ? `<div class="song-album">${escapeHtml(song.album_name)}</div>` : ''}
                ${song.audio ? `<audio class="song-audio" controls src="${song.audio}"></audio>` : ''}
                ${song.license_ccurl ? `<a class="song-link" href="${song.license_ccurl}" target="_blank" rel="noopener noreferrer">License & credit →</a>` : ''}
                ${song.shareurl ? `<a class="song-link" href="${song.shareurl}" target="_blank" rel="noopener noreferrer">View on Jamendo →</a>` : ''}
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
