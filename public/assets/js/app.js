/* ============================================
   Small App Tools landing-page card controller
   ============================================ */

const tools = {
    calculator: { load: () => import('./tools/calculator.js'), label: 'Basic Calculator' },
    bmi: { load: () => import('./tools/bmi.js'), label: 'BMI Calculator' },
    mortgage: { load: () => import('./tools/mortgage.js'), label: 'Mortgage Calculator' },
    retirement: { load: () => import('./tools/retirement.js'), label: 'Retirement Calculator' },
    'image-compression': { load: () => import('./tools/image-compression.js'), label: 'Image Compression' },
    weather: { load: () => import('./tools/weather.js'), label: 'Weather Dashboard' },
    'qr-code': { load: () => import('./tools/qr-code.js'), label: 'QR Code Generator' },
    pomodoro: { load: () => import('./tools/pomodoro.js'), label: 'Pomodoro Timer' },
    'art-of-the-day': { load: () => import('./tools/art-of-the-day.js'), label: 'Art Piece of the Day' },
    'song-of-the-day': { load: () => import('./tools/song-of-the-day.js'), label: 'Song of the Day' },
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

async function openCard(card) {
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
    activeCard = card;
    activeUnmount = null;

    const { mount } = await tools[toolKey].load();
    if (activeCard !== card) return;
    activeUnmount = mount(toolContainer, { mode: 'card' });
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
