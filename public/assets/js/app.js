/* ============================================
   Small App Tools landing-page card controller
   ============================================ */

import { mount as mountCalculator } from './tools/calculator.js';
import { mount as mountBmi } from './tools/bmi.js';
import { mount as mountMortgage } from './tools/mortgage.js';
import { mount as mountRetirement } from './tools/retirement.js';
import { mount as mountImageCompression } from './tools/image-compression.js';
import { mount as mountWeather } from './tools/weather.js';

const tools = {
    calculator: { mount: mountCalculator, label: 'Basic Calculator' },
    bmi: { mount: mountBmi, label: 'BMI Calculator' },
    mortgage: { mount: mountMortgage, label: 'Mortgage Calculator' },
    retirement: { mount: mountRetirement, label: 'Retirement Calculator' },
    'image-compression': { mount: mountImageCompression, label: 'Image Compression' },
    weather: { mount: mountWeather, label: 'Weather Dashboard' },
};

let activeCard = null;
let activeUnmount = null;

function closeActiveCard() {
    if (!activeCard) return;

    if (activeUnmount) {
        activeUnmount();
        activeUnmount = null;
    }

    const toolContainer = activeCard.querySelector('.card-tool');
    const summary = activeCard.querySelector('.card-summary');
    const closeBtn = activeCard.querySelector('.card-close');

    if (toolContainer) {
        toolContainer.innerHTML = '';
        toolContainer.style.display = 'none';
    }
    if (summary) summary.style.display = 'flex';
    if (closeBtn) closeBtn.remove();

    activeCard.classList.remove('active');
    activeCard = null;
}

function openCard(card) {
    const toolKey = card.dataset.tool;
    if (!toolKey || !tools[toolKey]) return;

    if (activeCard && activeCard !== card) {
        closeActiveCard();
    }

    const summary = card.querySelector('.card-summary');
    const toolContainer = card.querySelector('.card-tool');
    if (!summary || !toolContainer) return;

    card.classList.add('active');
    summary.style.display = 'none';
    toolContainer.style.display = 'flex';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close';
    closeBtn.setAttribute('aria-label', `Close ${tools[toolKey].label}`);
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeActiveCard();
    });
    card.querySelector('.card-content').appendChild(closeBtn);

    toolContainer.id = `tool-${toolKey}-${Math.random().toString(36).slice(2, 8)}`;
    activeUnmount = tools[toolKey].mount(toolContainer, { mode: 'card' });
    activeCard = card;
}

function init() {
    document.querySelectorAll('.card[data-tool]').forEach((card) => {
        const openBtn = card.querySelector('[data-action="open"]');
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openCard(card);
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeCard) {
            closeActiveCard();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
