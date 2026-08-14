// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Basic calculator', () => {
  test('performs addition', async ({ page }) => {
    await page.goto('/Calculator.html');
    const display = page.locator('#display');

    await page.getByRole('button', { name: '7' }).click();
    await page.getByRole('button', { name: '+' }).click();
    await page.getByRole('button', { name: '5' }).click();
    await page.getByRole('button', { name: '=' }).click();

    await expect(display).toHaveText('12');
  });

  test('performs division and handles clear', async ({ page }) => {
    await page.goto('/Calculator.html');
    const display = page.locator('#display');

    await page.getByRole('button', { name: '9' }).click();
    await page.getByRole('button', { name: '÷' }).click();
    await page.getByRole('button', { name: '3' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await expect(display).toHaveText('3');

    await page.getByRole('button', { name: 'C' }).click();
    await expect(display).toHaveText('0');
  });
});

test.describe('BMI calculator', () => {
  test('computes BMI in imperial units', async ({ page }) => {
    await page.goto('/Calculator-BMI.html');

    await page.locator('#weight').fill('150');
    await page.locator('#height').fill('70');
    await page.getByRole('button', { name: 'Calculate BMI' }).click();

    await expect(page.locator('#bmiResult')).toHaveText('21.5');
    await expect(page.locator('#bmiCategory')).toHaveText('Normal Weight');
    await expect(page.locator('#resultSection')).toBeVisible();
  });

  test('computes BMI in metric units', async ({ page }) => {
    await page.goto('/Calculator-BMI.html');

    await page.getByRole('button', { name: 'Metric (kg, cm)' }).click();
    await page.locator('#weight').fill('70');
    await page.locator('#height').fill('175');
    await page.getByRole('button', { name: 'Calculate BMI' }).click();

    await expect(page.locator('#bmiResult')).toHaveText('22.9');
    await expect(page.locator('#bmiCategory')).toHaveText('Normal Weight');
  });

  test('shows an error for invalid input', async ({ page }) => {
    await page.goto('/Calculator-BMI.html');

    await page.locator('#weight').fill('0');
    await page.locator('#height').fill('70');
    await page.getByRole('button', { name: 'Calculate BMI' }).click();

    await expect(page.locator('#error')).toHaveText('Please enter a valid weight.');
  });
});

test.describe('Mortgage calculator', () => {
  test('computes monthly payment from the standard formula', async ({ page }) => {
    await page.goto('/Calculator-Mortgage.html');

    const price = 300000;
    const down = 60000;
    const rate = 6.5;
    const years = 30;

    await page.locator('#homePrice').fill(String(price));
    await page.locator('#downPayment').fill(String(down));
    await page.locator('#interestRate').fill(String(rate));
    await page.locator('#loanTerm').fill(String(years));
    await page.getByRole('button', { name: 'Calculate' }).click();

    const principal = price - down;
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    const expected =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
      (Math.pow(1 + monthlyRate, n) - 1);
    const expectedText = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(expected);

    await expect(page.locator('#monthlyPayment')).toHaveText(expectedText);
    await expect(page.locator('#results')).toHaveClass(/show/);
  });

  test('rejects a down payment >= home price', async ({ page }) => {
    await page.goto('/Calculator-Mortgage.html');

    await page.locator('#homePrice').fill('300000');
    await page.locator('#downPayment').fill('300000');
    await page.getByRole('button', { name: 'Calculate' }).click();

    await expect(page.locator('#error')).toHaveText(
      'Down payment cannot be greater than or equal to home price.'
    );
  });
});

test.describe('Retirement calculator', () => {
  test('projects savings and enables export', async ({ page }) => {
    await page.goto('/Calculator-Retirement.html');

    await page.locator('#currentAge').fill('30');
    await page.locator('#retirementAge').fill('65');
    await page.locator('#lifeExpectancy').fill('85');
    await page.locator('#currentSavings').fill('50000');
    await page.locator('#annualContribution').fill('10000');
    await page.locator('#annualReturn').fill('7');
    await page.getByRole('button', { name: 'Calculate' }).click();

    await expect(page.locator('#yearsToRetirement')).toHaveText('35');
    await expect(page.locator('#yearsInRetirement')).toHaveText('20');
    await expect(page.locator('#projectedSavings')).not.toHaveText('-');
    await expect(page.locator('#exportBtn')).toBeEnabled();
    await expect(page.locator('#resultsSection')).toHaveClass(/show/);
  });

  test('rejects retirement age not greater than current age', async ({ page }) => {
    await page.goto('/Calculator-Retirement.html');

    await page.locator('#currentAge').fill('65');
    await page.locator('#retirementAge').fill('65');
    await page.getByRole('button', { name: 'Calculate' }).click();

    await expect(page.locator('#error')).toHaveText(
      'Retirement age must be greater than current age.'
    );
  });
});
