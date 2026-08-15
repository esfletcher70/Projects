/* ============================================
   Small App Tools Basic Calculator (tool module)
   ============================================ */

import { qs } from '../common.js';

export function mount(container) {
    container.innerHTML = `
        <div class="tool-section">
            <div class="calc-display" id="display">0</div>
            <div class="calc-grid" data-grid>
                <button class="clear" data-clear>C</button>
                <button class="operator" data-op="/">÷</button>
                <button class="operator" data-op="*">×</button>

                <button class="number" data-num="7">7</button>
                <button class="number" data-num="8">8</button>
                <button class="number" data-num="9">9</button>
                <button class="operator" data-op="-">−</button>

                <button class="number" data-num="4">4</button>
                <button class="number" data-num="5">5</button>
                <button class="number" data-num="6">6</button>
                <button class="operator" data-op="+">+</button>

                <button class="number" data-num="1">1</button>
                <button class="number" data-num="2">2</button>
                <button class="number" data-num="3">3</button>
                <button class="operator" data-sign>±</button>

                <button class="number" data-num="0">0</button>
                <button class="decimal" data-decimal>.</button>
                <button class="equals" data-equals>=</button>
            </div>
        </div>
    `;

    const display = qs(container, '#display');
    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetDisplay = false;

    function updateDisplay() {
        display.textContent = currentInput;
    }

    function appendNumber(num) {
        if (shouldResetDisplay) {
            currentInput = num;
            shouldResetDisplay = false;
        } else if (currentInput === '0' && num !== '.') {
            currentInput = num;
        } else {
            currentInput += num;
        }
        updateDisplay();
    }

    function appendOperator(op) {
        if (operator !== null && !shouldResetDisplay) {
            calculate();
        }
        previousInput = currentInput;
        operator = op;
        shouldResetDisplay = true;
    }

    function appendDecimal() {
        if (shouldResetDisplay) {
            currentInput = '0.';
            shouldResetDisplay = false;
        } else if (!currentInput.includes('.')) {
            currentInput += '.';
        }
        updateDisplay();
    }

    function toggleSign() {
        if (currentInput !== '0') {
            currentInput = currentInput.startsWith('-')
                ? currentInput.slice(1)
                : '-' + currentInput;
            updateDisplay();
        }
    }

    function calculate() {
        if (operator === null || shouldResetDisplay) return;

        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        let result;

        switch (operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                result = current !== 0 ? prev / current : 0;
                break;
            default:
                return;
        }

        currentInput = result.toString();
        operator = null;
        shouldResetDisplay = true;
        updateDisplay();
    }

    function clearDisplay() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetDisplay = false;
        updateDisplay();
    }

    function onClick(e) {
        const numBtn = e.target.closest('[data-num]');
        const opBtn = e.target.closest('[data-op]');
        const clearBtn = e.target.closest('[data-clear]');
        const decimalBtn = e.target.closest('[data-decimal]');
        const signBtn = e.target.closest('[data-sign]');
        const equalsBtn = e.target.closest('[data-equals]');

        if (numBtn) appendNumber(numBtn.dataset.num);
        if (opBtn) appendOperator(opBtn.dataset.op);
        if (clearBtn) clearDisplay();
        if (decimalBtn) appendDecimal();
        if (signBtn) toggleSign();
        if (equalsBtn) calculate();
    }

    const grid = qs(container, '[data-grid]');
    grid.addEventListener('click', onClick);

    return function unmount() {
        grid.removeEventListener('click', onClick);
    };
}
