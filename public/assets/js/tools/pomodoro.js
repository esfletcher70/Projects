/* ============================================
   Small App Tools Pomodoro Timer (tool module)
   ============================================ */

import { qs, trackListeners, showSuccess } from '../common.js';

const DURATIONS = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
const WORK_SESSIONS_PER_CYCLE = 4;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function mount(container) {
    container.innerHTML = `
        <div class="tool-alert success"></div>
        <div class="tool-section">
            <div class="result-block">
                <div class="result-label" data-status-line>Work Session <span data-session-num>1</span> of ${WORK_SESSIONS_PER_CYCLE}</div>
                <div class="result-value timer-display" data-time>${formatTime(DURATIONS.work)}</div>
                <div class="result-category phase-work" data-phase-pill>Work</div>
            </div>
            <div class="pomodoro-dots" data-dots>
                ${Array.from({ length: WORK_SESSIONS_PER_CYCLE }, (_, i) => `<span class="dot" data-dot="${i + 1}"></span>`).join('')}
            </div>
            <div class="button-group">
                <button class="tool-btn primary" data-start>Start</button>
                <button class="tool-btn secondary" data-pause disabled>Pause</button>
                <button class="tool-btn danger" data-reset>Reset</button>
            </div>
        </div>
    `;

    let phase = 'work';
    let sessionNum = 1;
    let remaining = DURATIONS.work;
    let intervalId = null;
    const originalTitle = document.title;

    const statusLine = qs(container, '[data-status-line]');
    const timeEl = qs(container, '[data-time]');
    const phasePill = qs(container, '[data-phase-pill]');
    const dots = container.querySelectorAll('[data-dot]');
    const startBtn = qs(container, '[data-start]');
    const pauseBtn = qs(container, '[data-pause]');
    const resetBtn = qs(container, '[data-reset]');

    function render() {
        timeEl.textContent = formatTime(remaining);

        if (phase === 'work') {
            statusLine.innerHTML = `Work Session <span data-session-num>${sessionNum}</span> of ${WORK_SESSIONS_PER_CYCLE}`;
            phasePill.textContent = 'Work';
            phasePill.className = 'result-category phase-work';
        } else if (phase === 'short') {
            statusLine.textContent = 'Short Break';
            phasePill.textContent = 'Short Break';
            phasePill.className = 'result-category phase-short';
        } else {
            statusLine.textContent = 'Long Break';
            phasePill.textContent = 'Long Break';
            phasePill.className = 'result-category phase-long';
        }

        dots.forEach((dot) => {
            const n = Number(dot.dataset.dot);
            let completed;
            if (phase === 'work') {
                completed = n < sessionNum;
            } else if (phase === 'short') {
                completed = n <= sessionNum;
            } else {
                completed = true;
            }
            dot.classList.toggle('completed', completed);
            dot.classList.toggle('current', phase === 'work' && n === sessionNum);
        });

        if (intervalId) {
            document.title = `${formatTime(remaining)} · ${phasePill.textContent}`;
        }
    }

    function advancePhase() {
        let message;
        if (phase === 'work') {
            phase = sessionNum === WORK_SESSIONS_PER_CYCLE ? 'long' : 'short';
            message = phase === 'long' ? 'Great work! Time for a long break.' : 'Nice! Take a short break.';
        } else {
            if (phase === 'long') {
                sessionNum = 1;
            } else {
                sessionNum += 1;
            }
            phase = 'work';
            message = "Break's over — back to work!";
        }
        remaining = DURATIONS[phase];
        showSuccess(message, container);
        render();
    }

    function tick() {
        remaining -= 1;
        if (remaining <= 0) {
            advancePhase();
        } else {
            render();
        }
    }

    function start() {
        if (intervalId) return;
        intervalId = setInterval(tick, 1000);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        render();
    }

    function pause() {
        if (!intervalId) return;
        clearInterval(intervalId);
        intervalId = null;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        document.title = originalTitle;
    }

    function reset() {
        clearInterval(intervalId);
        intervalId = null;
        phase = 'work';
        sessionNum = 1;
        remaining = DURATIONS.work;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        document.title = originalTitle;
        render();
    }

    const { add, cleanup } = trackListeners();

    add(startBtn, 'click', start);
    add(pauseBtn, 'click', pause);
    add(resetBtn, 'click', reset);

    return function unmount() {
        clearInterval(intervalId);
        document.title = originalTitle;
        cleanup();
    };
}
