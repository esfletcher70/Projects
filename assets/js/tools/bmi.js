/* ============================================
   AppHub BMI Calculator (tool module)
   ============================================ */

import { showError, hideError, qs } from '../common.js';

export function mount(container, options = {}) {
    const mode = options.mode || 'card';
    container.innerHTML = `
        <div id="error" class="error"></div>
        <div class="tool-section">
            <div class="toggle-group" data-unit-toggle>
                <button class="toggle-btn active" data-unit="imperial" id="imperialBtn">Imperial (lbs, in)</button>
                <button class="toggle-btn" data-unit="metric" id="metricBtn">Metric (kg, cm)</button>
            </div>
            <div class="tool-form compact-2">
                <div class="form-group">
                    <label for="weight">Weight</label>
                    <div class="input-wrapper">
                        <input type="number" id="weight" data-weight placeholder="Enter weight" step="0.1" min="0">
                        <span class="unit-label" data-weight-unit>lbs</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="height">Height</label>
                    <div class="input-wrapper">
                        <input type="number" id="height" data-height placeholder="Enter height" step="0.1" min="0">
                        <span class="unit-label" data-height-unit>in</span>
                    </div>
                </div>
            </div>
            <div class="button-group">
                <button class="tool-btn primary" id="calculateBtn" data-calculate>Calculate BMI</button>
                <button class="tool-btn secondary" id="resetBtn" data-reset>Reset</button>
            </div>
            <div class="result-block" id="resultSection" data-result style="display: none;">
                <div class="result-label">Your BMI</div>
                <div class="result-value" id="bmiResult" data-bmi>-</div>
                <div class="result-category" id="bmiCategory" data-category></div>
            </div>
        </div>
    `;

    let currentUnit = 'imperial';

    const weightInput = qs(container, '#weight');
    const heightInput = qs(container, '#height');
    const weightUnit = qs(container, '[data-weight-unit]');
    const heightUnit = qs(container, '[data-height-unit]');
    const resultBlock = qs(container, '#resultSection');
    const bmiValue = qs(container, '#bmiResult');
    const category = qs(container, '#bmiCategory');

    function setUnit(unit) {
        currentUnit = unit;
        container.querySelectorAll('[data-unit-toggle] .toggle-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        if (unit === 'metric') {
            weightUnit.textContent = 'kg';
            heightUnit.textContent = 'cm';
        } else {
            weightUnit.textContent = 'lbs';
            heightUnit.textContent = 'in';
        }
        weightInput.value = '';
        heightInput.value = '';
        resultBlock.style.display = 'none';
        hideError(container);
    }

    function calculateBMI() {
        hideError(container);

        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);

        if (!weight || weight <= 0) {
            showError('Please enter a valid weight.', container);
            return;
        }
        if (!height || height <= 0) {
            showError('Please enter a valid height.', container);
            return;
        }

        let bmi;
        if (currentUnit === 'metric') {
            bmi = weight / Math.pow(height / 100, 2);
        } else {
            bmi = (weight / Math.pow(height, 2)) * 703;
        }

        bmiValue.textContent = bmi.toFixed(1);

        let className, label;
        if (bmi < 18.5) {
            className = 'underweight';
            label = 'Underweight';
        } else if (bmi < 25) {
            className = 'normal';
            label = 'Normal Weight';
        } else if (bmi < 30) {
            className = 'overweight';
            label = 'Overweight';
        } else {
            className = 'obese';
            label = 'Obese';
        }

        category.textContent = label;
        category.className = `result-category ${className}`;
        resultBlock.style.display = 'block';
    }

    function reset() {
        weightInput.value = '';
        heightInput.value = '';
        resultBlock.style.display = 'none';
        hideError(container);
    }

    function onClick(e) {
        const unitBtn = e.target.closest('[data-unit]');
        if (unitBtn) {
            setUnit(unitBtn.dataset.unit);
            return;
        }
        if (e.target.closest('[data-calculate]')) {
            calculateBMI();
            return;
        }
        if (e.target.closest('[data-reset]')) {
            reset();
        }
    }

    container.addEventListener('click', onClick);
    weightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateBMI();
    });
    heightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateBMI();
    });

    if (mode === 'standalone') {
        // Embed/share modal would be wired here if the standalone page needs it.
    }

    return function unmount() {
        container.removeEventListener('click', onClick);
    };
}
