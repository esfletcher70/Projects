/* ============================================
   Small App Tools Image Compression (tool module)
   ============================================ */

import {
    formatFileSize,
    getFormatFromMime,
    getExtensionFromMime,
    showSuccess,
    showError,
    hideError,
    hideSuccess,
    qs
} from '../common.js';

export function mount(container) {
    container.innerHTML = `
        <div id="error" class="error"></div>
        <div id="success" class="success"></div>
        <div class="tool-section">
            <div id="uploadZone" class="upload-zone" data-upload-zone>
                <div>Click or drag and drop an image here</div>
                <input type="file" id="fileInput" data-file-input accept="image/*">
            </div>
            <div id="statsGrid" data-controls style="display: none;">
                <div class="quality-row">
                    <label for="qualitySlider">Quality:</label>
                    <input type="range" id="qualitySlider" data-quality min="1" max="100" value="80">
                    <span id="qualityValue" data-quality-value>80%</span>
                </div>
                <div class="toggle-group" data-format-group>
                    <button class="format-btn active" id="jpegBtn" data-format="image/jpeg">JPEG</button>
                    <button class="format-btn" id="pngBtn" data-format="image/png">PNG</button>
                    <button class="format-btn" id="webpBtn" data-format="image/webp">WebP</button>
                </div>
            </div>
            <div class="preview-row" data-preview style="display: none;">
                <div>
                    <img id="originalImage" data-original alt="Original">
                    <div class="preview-info">Original: <span id="originalSize" data-original-size></span> <span id="originalFormat" data-original-format></span></div>
                </div>
                <div>
                    <img id="compressedImage" data-compressed alt="Compressed">
                    <div class="preview-info">Compressed: <span id="compressedSize" data-compressed-size></span> <span id="compressedFormat" data-compressed-format></span></div>
                </div>
            </div>
            <div class="stats-row" data-stats style="display: none;">
                <div class="stat-card">
                    <div class="stat-label">Compression Ratio</div>
                    <div class="stat-value" id="compressionRatio" data-compression-ratio>-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Space Saved</div>
                    <div class="stat-value" id="spaceSaved" data-space-saved>-</div>
                </div>
            </div>
            <div class="button-group" data-buttons style="display: none;">
                <button class="tool-btn btn-success" id="downloadBtn" data-download>Download</button>
                <button class="tool-btn secondary" id="resetBtn" data-reset>Reset</button>
            </div>
        </div>
    `;

    let originalFile = null;
    let originalBase64 = null;
    let selectedFormat = 'image/jpeg';
    let compressedData = null;

    const uploadZone = qs(container, '#uploadZone');
    const fileInput = qs(container, '#fileInput');
    const controls = qs(container, '#statsGrid');
    const qualitySlider = qs(container, '#qualitySlider');
    const qualityValue = qs(container, '#qualityValue');
    const preview = qs(container, '[data-preview]');
    const originalImage = qs(container, '#originalImage');
    const compressedImage = qs(container, '#compressedImage');
    const originalSize = qs(container, '#originalSize');
    const compressedSize = qs(container, '#compressedSize');
    const originalFormat = qs(container, '#originalFormat');
    const compressedFormat = qs(container, '#compressedFormat');
    const compressionRatio = qs(container, '#compressionRatio');
    const spaceSaved = qs(container, '#spaceSaved');
    const stats = qs(container, '[data-stats]');
    const buttons = qs(container, '[data-buttons]');

    function handleDragOver(e) {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            loadImage(e.dataTransfer.files[0]);
        }
    }

    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            loadImage(e.target.files[0]);
        }
    }

    function loadImage(file) {
        hideError(container);
        hideSuccess(container);

        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file.', container);
            return;
        }

        originalFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            originalBase64 = e.target.result;
            originalImage.src = originalBase64;
            originalSize.textContent = formatFileSize(file.size);
            originalFormat.textContent = getFormatFromMime(file.type);

            controls.style.display = 'block';
            compressImage();
        };
        reader.readAsDataURL(file);
    }

    function handleQualityChange() {
        qualityValue.textContent = qualitySlider.value + '%';
        compressImage();
    }

    function handleFormatChange(e) {
        const btn = e.target.closest('[data-format]');
        if (!btn) return;
        container.querySelectorAll('[data-format-group] .format-btn').forEach((b) => {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        selectedFormat = btn.dataset.format;
        compressImage();
    }

    function compressImage() {
        if (!originalBase64) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const quality = qualitySlider.value / 100;
            const dataUrl = canvas.toDataURL(selectedFormat, quality);
            compressedData = dataUrl;
            compressedImage.src = dataUrl;

            const compressedBytes = Math.round((dataUrl.length * 3) / 4);
            compressedSize.textContent = formatFileSize(compressedBytes);
            compressedFormat.textContent = getFormatFromMime(selectedFormat);

            updateStats(originalFile.size, compressedBytes);

            preview.style.display = 'grid';
            stats.style.display = 'grid';
            buttons.style.display = 'flex';
        };
        img.src = originalBase64;
    }

    function updateStats(originalBytes, compressedBytes) {
        const ratio = ((originalBytes - compressedBytes) / originalBytes * 100).toFixed(2);
        const saved = formatFileSize(originalBytes - compressedBytes);
        compressionRatio.textContent = ratio + '%';
        spaceSaved.textContent = saved;
    }

    function download() {
        if (!compressedData || !originalFile) return;

        const link = document.createElement('a');
        link.href = compressedData;
        const originalName = originalFile.name.split('.').slice(0, -1).join('.');
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const ext = getExtensionFromMime(selectedFormat);
        link.download = `${originalName}-Compressed-${dateStr}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Image downloaded successfully!', container);
    }

    function reset() {
        fileInput.value = '';
        originalFile = null;
        originalBase64 = null;
        compressedData = null;

        controls.style.display = 'none';
        preview.style.display = 'none';
        stats.style.display = 'none';
        buttons.style.display = 'none';
        qualitySlider.value = 80;
        qualityValue.textContent = '80%';
        selectedFormat = 'image/jpeg';
        container.querySelectorAll('[data-format-group] .format-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.format === 'image/jpeg');
        });
        hideError(container);
        hideSuccess(container);
    }

    const listeners = [];
    function add(el, event, fn) {
        el.addEventListener(event, fn);
        listeners.push({ el, event, fn });
    }

    add(uploadZone, 'click', () => fileInput.click());
    add(uploadZone, 'dragover', handleDragOver);
    add(uploadZone, 'dragleave', handleDragLeave);
    add(uploadZone, 'drop', handleDrop);
    add(fileInput, 'change', handleFileSelect);
    add(qualitySlider, 'input', handleQualityChange);
    const formatGroup = qs(container, '[data-format-group]');
    formatGroup.addEventListener('click', handleFormatChange);
    listeners.push({ el: formatGroup, event: 'click', fn: handleFormatChange });
    const downloadBtn = qs(container, '#downloadBtn');
    downloadBtn.addEventListener('click', download);
    listeners.push({ el: downloadBtn, event: 'click', fn: download });
    const resetBtn = qs(container, '#resetBtn');
    resetBtn.addEventListener('click', reset);
    listeners.push({ el: resetBtn, event: 'click', fn: reset });

    return function unmount() {
        listeners.forEach(({ el, event, fn }) => el.removeEventListener(event, fn));
    };
}
