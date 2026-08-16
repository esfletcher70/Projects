/* ============================================
   Small App Tools Mortgage Calculator (tool module)
   ============================================ */

import { formatCurrency, hideError, qs, requireValid } from '../common.js';

export function mount(container) {
    container.innerHTML = `
        <div id="error" class="error"></div>
        <div class="tool-section">
            <div class="tool-form compact-2 compact mortgage-form">
                <div class="form-group">
                    <label for="homePrice">Home Price</label>
                    <input type="number" id="homePrice" data-price placeholder="300000" value="300000" step="1000" min="0">
                </div>
                <div class="form-group">
                    <label for="downPayment">Down Payment</label>
                    <input type="number" id="downPayment" data-down placeholder="60000" value="60000" step="1000" min="0">
                </div>
                <div class="form-group">
                    <label for="interestRate">Interest Rate (%)</label>
                    <input type="number" id="interestRate" data-rate placeholder="6.5" value="6.5" step="0.1" min="0" max="20">
                </div>
                <div class="form-group">
                    <label for="loanTerm">Loan Term (years)</label>
                    <input type="number" id="loanTerm" data-term placeholder="30" value="30" step="1" min="1" max="50">
                </div>
            </div>
            <div class="form-group mortgage-loan" style="margin-top: 12px;">
                <label>Loan Amount</label>
                <input type="number" id="loanAmount" data-loan-amount readonly value="240000">
            </div>
            <div class="button-group" style="margin-top: 12px;">
                <button class="tool-btn primary" id="calculateBtn" data-calculate>Calculate</button>
                <button class="tool-btn secondary" id="resetBtn" data-reset>Reset</button>
            </div>
            <div id="results" class="results" data-results style="display: none; margin-top: 12px;">
                <div class="result-item">
                    <span class="result-label">Monthly Payment</span>
                    <span class="result-value" id="monthlyPayment" data-monthly>-</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Total Payment</span>
                    <span class="result-value" id="totalPayment" data-total>-</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Total Interest</span>
                    <span class="result-value" id="totalInterest" data-interest>-</span>
                </div>
            </div>
        </div>
    `;

    const priceInput = qs(container, '#homePrice');
    const downInput = qs(container, '#downPayment');
    const rateInput = qs(container, '#interestRate');
    const termInput = qs(container, '#loanTerm');
    const loanAmountInput = qs(container, '#loanAmount');
    const resultsDiv = qs(container, '#results');
    const monthlyDisplay = qs(container, '#monthlyPayment');
    const totalDisplay = qs(container, '#totalPayment');
    const interestDisplay = qs(container, '#totalInterest');

    function updateLoanAmount() {
        const price = parseFloat(priceInput.value) || 0;
        const down = parseFloat(downInput.value) || 0;
        loanAmountInput.value = Math.max(0, price - down).toString();
    }

    function calculateMortgage() {
        hideError(container);

        const price = parseFloat(priceInput.value) || 0;
        const down = parseFloat(downInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const term = parseInt(termInput.value, 10) || 0;

        if (!requireValid(price > 0, 'Please enter a valid home price.', container)) return;
        if (!requireValid(down >= 0, 'Please enter a valid down payment.', container)) return;
        if (!requireValid(down < price, 'Down payment cannot be greater than or equal to home price.', container)) return;
        if (!requireValid(rate > 0, 'Please enter a valid interest rate.', container)) return;
        if (!requireValid(term > 0, 'Please enter a valid loan term.', container)) return;

        const loanAmount = price - down;
        const monthlyRate = rate / 100 / 12;
        const numberOfPayments = term * 12;

        const monthlyPayment =
            (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        const totalPayment = monthlyPayment * numberOfPayments;
        const totalInterest = totalPayment - loanAmount;

        monthlyDisplay.textContent = formatCurrency(monthlyPayment, 2);
        totalDisplay.textContent = formatCurrency(totalPayment, 2);
        interestDisplay.textContent = formatCurrency(totalInterest, 2);
        resultsDiv.style.display = 'block';
        resultsDiv.classList.add('show');
    }

    function reset() {
        priceInput.value = '300000';
        downInput.value = '60000';
        rateInput.value = '6.5';
        termInput.value = '30';
        updateLoanAmount();
        resultsDiv.style.display = 'none';
        hideError(container);
    }

    function onInput() {
        updateLoanAmount();
        hideError(container);
    }

    function onClick(e) {
        if (e.target.closest('[data-calculate]')) calculateMortgage();
        if (e.target.closest('[data-reset]')) reset();
    }

    container.addEventListener('click', onClick);
    priceInput.addEventListener('input', onInput);
    downInput.addEventListener('input', onInput);

    updateLoanAmount();

    return function unmount() {
        container.removeEventListener('click', onClick);
        priceInput.removeEventListener('input', onInput);
        downInput.removeEventListener('input', onInput);
    };
}
