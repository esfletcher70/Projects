/* ============================================
   Small App Tools QR Code Generator (tool module)
   ============================================ */

import qrcode from '../vendor/qrcode.js';
import { showSuccess, showError, hideError, hideSuccess, qs } from '../common.js';

const CELL_SIZE = 8;
const MARGIN = 4;

function escapeWifiValue(value) {
    return value.replace(/([\\;,:"])/g, '\\$1');
}

function buildWifiString(ssid, password, security, hidden) {
    const parts = ['WIFI:'];
    parts.push('T:' + security + ';');
    parts.push('S:' + escapeWifiValue(ssid) + ';');
    if (security !== 'nopass') {
        parts.push('P:' + escapeWifiValue(password) + ';');
    }
    parts.push('H:' + (hidden ? 'true' : 'false') + ';;');
    return parts.join('');
}

function generateDataUrl(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();

    const count = qr.getModuleCount();
    const size = (count + MARGIN * 2) * CELL_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (let row = 0; row < count; row += 1) {
        for (let col = 0; col < count; col += 1) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(
                    (col + MARGIN) * CELL_SIZE,
                    (row + MARGIN) * CELL_SIZE,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }
    return canvas.toDataURL('image/png');
}

export function mount(container) {
    container.innerHTML = `
        <div class="tool-alert error"></div>
        <div class="tool-alert success"></div>
        <div class="tool-section">
            <div class="toggle-group" data-type-group>
                <button class="format-btn active" data-type="text">Text / URL</button>
                <button class="format-btn" data-type="wifi">Wi-Fi</button>
            </div>
            <div class="tool-form" data-text-form>
                <div class="form-group">
                    <label for="qrText">Text or URL</label>
                    <input type="text" id="qrText" data-text-input placeholder="Enter text or URL...">
                </div>
            </div>
            <div class="tool-form" data-wifi-form style="display: none;">
                <div class="form-group">
                    <label for="wifiSsid">Network name (SSID)</label>
                    <input type="text" id="wifiSsid" data-wifi-ssid placeholder="MyNetwork">
                </div>
                <div class="form-group">
                    <label for="wifiPassword">Password</label>
                    <input type="text" id="wifiPassword" data-wifi-password placeholder="password">
                </div>
                <div class="form-group">
                    <label for="wifiSecurity">Security</label>
                    <select id="wifiSecurity" data-wifi-security>
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (open)</option>
                    </select>
                </div>
                <label class="checkbox-row">
                    <input type="checkbox" data-wifi-hidden> Hidden network
                </label>
            </div>
            <div class="qr-preview" data-preview style="display: none;">
                <img id="qrPreview" data-preview-img alt="QR Code preview">
            </div>
            <div class="button-group" data-buttons style="display: none;">
                <button class="tool-btn btn-success" data-download>Download PNG</button>
            </div>
        </div>
    `;

    let currentType = 'text';
    let currentDataUrl = null;

    const typeGroup = qs(container, '[data-type-group]');
    const textForm = qs(container, '[data-text-form]');
    const wifiForm = qs(container, '[data-wifi-form]');
    const textInput = qs(container, '[data-text-input]');
    const wifiSsid = qs(container, '[data-wifi-ssid]');
    const wifiPassword = qs(container, '[data-wifi-password]');
    const wifiSecurity = qs(container, '[data-wifi-security]');
    const wifiHidden = qs(container, '[data-wifi-hidden]');
    const preview = qs(container, '[data-preview]');
    const previewImg = qs(container, '[data-preview-img]');
    const buttons = qs(container, '[data-buttons]');
    const downloadBtn = qs(container, '[data-download]');

    function setType(type) {
        currentType = type;
        container.querySelectorAll('[data-type-group] .format-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.type === type);
        });
        textForm.style.display = type === 'text' ? 'grid' : 'none';
        wifiForm.style.display = type === 'wifi' ? 'grid' : 'none';
        hideError(container);
        hideSuccess(container);
        regenerate();
    }

    function currentPayload() {
        if (currentType === 'wifi') {
            return buildWifiString(
                wifiSsid.value,
                wifiPassword.value,
                wifiSecurity.value,
                wifiHidden.checked
            );
        }
        return textInput.value;
    }

    function regenerate() {
        const payload = currentPayload();
        if (!payload) {
            currentDataUrl = null;
            preview.style.display = 'none';
            buttons.style.display = 'none';
            previewImg.removeAttribute('src');
            return;
        }
        try {
            currentDataUrl = generateDataUrl(payload);
            previewImg.src = currentDataUrl;
            preview.style.display = 'flex';
            buttons.style.display = 'flex';
            hideError(container);
        } catch (err) {
            currentDataUrl = null;
            preview.style.display = 'none';
            buttons.style.display = 'none';
            showError('The content is too long to encode as a QR code.', container);
        }
    }

    function download() {
        if (!currentDataUrl) return;

        const link = document.createElement('a');
        link.href = currentDataUrl;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        link.download = `qr-code-${dateStr}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('QR code downloaded successfully!', container);
    }

    const listeners = [];
    function add(el, event, fn) {
        el.addEventListener(event, fn);
        listeners.push({ el, event, fn });
    }

    add(typeGroup, 'click', (e) => {
        const btn = e.target.closest('[data-type]');
        if (btn) setType(btn.dataset.type);
    });
    add(textInput, 'input', regenerate);
    add(wifiSsid, 'input', regenerate);
    add(wifiPassword, 'input', regenerate);
    add(wifiSecurity, 'change', regenerate);
    add(wifiHidden, 'change', regenerate);
    add(downloadBtn, 'click', download);

    return function unmount() {
        listeners.forEach(({ el, event, fn }) => el.removeEventListener(event, fn));
    };
}
