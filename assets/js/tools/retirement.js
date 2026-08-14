/* ============================================
   AppHub Retirement Calculator (tool module)
   ============================================ */

import { formatCurrency, showError, hideError, qs } from '../common.js';

export function mount(container) {
    container.innerHTML = `
        <div id="error" class="error"></div>
        <div class="tool-section">
            <div class="tool-form compact-2">
                <div class="form-group">
                    <label for="currentAge">Current Age</label>
                    <input type="number" id="currentAge" data-current-age placeholder="30" value="30" min="1">
                </div>
                <div class="form-group">
                    <label for="retirementAge">Retirement Age</label>
                    <input type="number" id="retirementAge" data-retirement-age placeholder="65" value="65" min="1">
                </div>
                <div class="form-group">
                    <label for="lifeExpectancy">Life Expectancy</label>
                    <input type="number" id="lifeExpectancy" data-life-expectancy placeholder="85" value="85" min="1">
                </div>
                <div class="form-group">
                    <label for="annualReturn">Annual Return (%)</label>
                    <input type="number" id="annualReturn" data-annual-return placeholder="7" value="7" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label for="currentSavings">Current Savings</label>
                    <input type="number" id="currentSavings" data-current-savings placeholder="50000" value="50000" min="0">
                </div>
                <div class="form-group">
                    <label for="annualContribution">Annual Contribution</label>
                    <input type="number" id="annualContribution" data-annual-contribution placeholder="10000" value="10000" min="0">
                </div>
            </div>
            <div class="button-group" style="margin-top: 12px;">
                <button class="tool-btn primary" id="calculateBtn" data-calculate>Calculate</button>
                <button class="tool-btn secondary" id="resetBtn" data-reset>Reset</button>
                <button class="tool-btn btn-success" id="exportBtn" data-export disabled>Export</button>
            </div>
            <div id="resultsSection" class="results-section" data-results style="display: none; margin-top: 12px;">
                <div class="result-grid">
                    <div class="result-cell">
                        <div class="label">Years to Retirement</div>
                        <div class="value" id="yearsToRetirement" data-years-to-retirement>-</div>
                    </div>
                    <div class="result-cell">
                        <div class="label">Years in Retirement</div>
                        <div class="value" id="yearsInRetirement" data-years-in-retirement>-</div>
                    </div>
                    <div class="result-cell">
                        <div class="label">Projected Savings</div>
                        <div class="value" id="projectedSavings" data-projected-savings>-</div>
                    </div>
                </div>
                <div class="mini-bar" data-bar style="margin-top: 12px;">
                    <div class="segment contributions" data-contribution-segment></div>
                    <div class="segment growth" data-growth-segment></div>
                </div>
            </div>
        </div>
    `;

    const currentAgeInput = qs(container, '#currentAge');
    const retirementAgeInput = qs(container, '#retirementAge');
    const lifeExpectancyInput = qs(container, '#lifeExpectancy');
    const annualReturnInput = qs(container, '#annualReturn');
    const currentSavingsInput = qs(container, '#currentSavings');
    const annualContributionInput = qs(container, '#annualContribution');
    const resultsSection = qs(container, '#resultsSection');
    const yearsToRetirement = qs(container, '#yearsToRetirement');
    const yearsInRetirement = qs(container, '#yearsInRetirement');
    const projectedSavings = qs(container, '#projectedSavings');
    const exportBtn = qs(container, '#exportBtn');
    const bar = qs(container, '[data-bar]');
    const contributionSegment = qs(container, '[data-contribution-segment]');
    const growthSegment = qs(container, '[data-growth-segment]');

    function calculate() {
        hideError(container);

        const currentAge = parseInt(currentAgeInput.value, 10);
        const retirementAge = parseInt(retirementAgeInput.value, 10);
        const lifeExpectancy = parseInt(lifeExpectancyInput.value, 10);
        const currentSavings = parseFloat(currentSavingsInput.value) || 0;
        const annualContribution = parseFloat(annualContributionInput.value) || 0;
        const annualReturn = parseFloat(annualReturnInput.value) || 0;

        if (!currentAge || currentAge <= 0) {
            showError('Please enter a valid current age.', container);
            return;
        }
        if (!retirementAge || retirementAge <= currentAge) {
            showError('Retirement age must be greater than current age.', container);
            return;
        }
        if (!lifeExpectancy || lifeExpectancy <= retirementAge) {
            showError('Life expectancy must be greater than retirement age.', container);
            return;
        }
        if (currentSavings < 0) {
            showError('Current savings cannot be negative.', container);
            return;
        }
        if (annualContribution < 0) {
            showError('Annual contribution cannot be negative.', container);
            return;
        }
        if (annualReturn < 0) {
            showError('Annual return cannot be negative.', container);
            return;
        }

        const yearsToRetirementValue = retirementAge - currentAge;
        const yearsInRetirementValue = lifeExpectancy - retirementAge;
        const monthlyReturn = annualReturn / 100 / 12;

        let balance = currentSavings;
        let totalContributions = currentSavings;

        for (let year = 0; year < yearsToRetirementValue; year++) {
            balance += annualContribution;
            totalContributions += annualContribution;
            for (let month = 0; month < 12; month++) {
                balance = balance * (1 + monthlyReturn);
            }
        }

        const projectedSavingsValue = balance;
        const investmentGrowth = projectedSavingsValue - totalContributions;

        yearsToRetirement.textContent = yearsToRetirementValue;
        yearsInRetirement.textContent = yearsInRetirementValue;
        projectedSavings.textContent = formatCurrency(projectedSavingsValue, 0);
        exportBtn.disabled = false;
        resultsSection.style.display = 'block';
        resultsSection.classList.add('show');

        if (projectedSavingsValue > 0) {
            const contributionPercent = (totalContributions / projectedSavingsValue) * 100;
            const growthPercent = (investmentGrowth / projectedSavingsValue) * 100;
            contributionSegment.style.width = `${contributionPercent}%`;
            contributionSegment.textContent = contributionPercent > 10 ? `${contributionPercent.toFixed(0)}%` : '';
            growthSegment.style.width = `${growthPercent}%`;
            growthSegment.textContent = growthPercent > 10 ? `${growthPercent.toFixed(0)}%` : '';
            bar.style.display = 'flex';
        } else {
            bar.style.display = 'none';
        }
    }

    function reset() {
        currentAgeInput.value = '30';
        retirementAgeInput.value = '65';
        lifeExpectancyInput.value = '85';
        annualReturnInput.value = '7';
        currentSavingsInput.value = '50000';
        annualContributionInput.value = '10000';
        resultsSection.style.display = 'none';
        resultsSection.classList.remove('show');
        bar.style.display = 'none';
        exportBtn.disabled = true;
        hideError(container);
    }

    function onClick(e) {
        if (e.target.closest('[data-calculate]')) calculate();
        if (e.target.closest('[data-reset]')) reset();
        if (e.target.closest('[data-export]')) {
            // Export placeholder: could generate CSV/JSON in the future.
        }
    }

    container.addEventListener('click', onClick);

    return function unmount() {
        container.removeEventListener('click', onClick);
    };
}
