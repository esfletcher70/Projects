// @ts-check
const { test, expect } = require('@playwright/test');
const { mockWeatherApi } = require('./helpers/mockWeather.js');
const path = require('path');

const FIXTURE = path.join(__dirname, 'fixtures', 'test-image.png');

function getCard(page, name) {
    return page.locator('.card', { hasText: name });
}

function openCard(page, name) {
    const card = getCard(page, name);
    return card.getByRole('button', { name: /Open|Calculate|Plan|Compress|Check|Generate/ }).click();
}

function closeCard(page, name) {
    return getCard(page, name).locator('.card-close').click();
}

test.describe('Card-embedded tools on the landing page', () => {
    test('opening a calculator card mounts the live tool', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'Basic Calculator');

        const card = getCard(page, 'Basic Calculator');
        await expect(card).toHaveClass(/active/);
        await expect(card.locator('#display')).toBeVisible();

        await card.getByRole('button', { name: '7' }).click();
        await card.getByRole('button', { name: '+' }).click();
        await card.getByRole('button', { name: '5' }).click();
        await card.getByRole('button', { name: '=' }).click();
        await expect(card.locator('#display')).toHaveText('12');
    });

    test('BMI calculator works inside its card', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'BMI Calculator');

        const card = getCard(page, 'BMI Calculator');
        await card.locator('#weight').fill('150');
        await card.locator('#height').fill('70');
        await card.getByRole('button', { name: 'Calculate BMI' }).click();

        await expect(card.locator('#bmiResult')).toHaveText('21.5');
        await expect(card.locator('#bmiCategory')).toHaveText('Normal Weight');
    });

    test('mortgage calculator works inside its card', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'Mortgage Calculator');

        const card = getCard(page, 'Mortgage Calculator');
        await card.locator('#homePrice').fill('300000');
        await card.locator('#downPayment').fill('60000');
        await card.locator('#interestRate').fill('6.5');
        await card.locator('#loanTerm').fill('30');
        await card.getByRole('button', { name: 'Calculate' }).click();

        await expect(card.locator('#monthlyPayment')).not.toHaveText('-');
        await expect(card.locator('#results')).toBeVisible();
    });

    test('retirement calculator works inside its card', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'Retirement Calculator');

        const card = getCard(page, 'Retirement Calculator');
        await card.locator('#currentAge').fill('30');
        await card.locator('#retirementAge').fill('65');
        await card.locator('#lifeExpectancy').fill('85');
        await card.locator('#currentSavings').fill('50000');
        await card.locator('#annualContribution').fill('10000');
        await card.locator('#annualReturn').fill('7');
        await card.getByRole('button', { name: 'Calculate' }).click();

        await expect(card.locator('#projectedSavings')).not.toHaveText('-');
        await expect(card.locator('#exportBtn')).toBeEnabled();
    });

    test('image compression works inside its card', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'Image Compression');

        const card = getCard(page, 'Image Compression');
        await card.locator('#fileInput').setInputFiles(FIXTURE);

        await expect(card.locator('#compressedImage')).toHaveAttribute('src', /^data:image/);
        await expect(card.locator('#statsGrid')).toBeVisible();
        await expect(card.locator('#downloadBtn')).toBeVisible();
    });

    test('QR code generator works inside its card', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'QR Code Generator');

        const card = getCard(page, 'QR Code Generator');
        await card.locator('#qrText').fill('https://smallapp.tools');

        await expect(card.locator('[data-preview-img]')).toHaveAttribute('src', /^data:image\/png/);
        await expect(card.locator('[data-download]')).toBeVisible();
    });

    test('weather dashboard works inside its card with mocked API', async ({ page }) => {
        await mockWeatherApi(page);
        await page.goto('/');
        await openCard(page, 'Weather Dashboard');

        const card = getCard(page, 'Weather Dashboard');
        await card.locator('#searchInput').fill('Los Angeles, CA');
        await card.getByRole('button', { name: 'Search' }).click();

        await expect(card.locator('#locationName')).toHaveText('Los Angeles, California');
        await expect(card.getByText('clear sky').first()).toBeVisible();
    });

    test('weather card provides a Use My Location button in the search field', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'Weather Dashboard');

        const card = getCard(page, 'Weather Dashboard');
        await expect(card.getByRole('button', { name: 'Use my location' })).toBeVisible();
    });

    test('closing a card restores the summary and unmounts the tool', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'Basic Calculator');

        const card = getCard(page, 'Basic Calculator');
        await expect(card.locator('#display')).toBeVisible();
        await closeCard(page, 'Basic Calculator');

        await expect(card).not.toHaveClass(/active/);
        await expect(card.locator('#display')).toHaveCount(0);
        await expect(card.getByRole('button', { name: 'Open Calculator' })).toBeVisible();
    });

    test('opening a second card closes the first one', async ({ page }) => {
        await page.goto('/');
        await openCard(page, 'Basic Calculator');
        await openCard(page, 'BMI Calculator');

        await expect(getCard(page, 'Basic Calculator')).not.toHaveClass(/active/);
        await expect(getCard(page, 'BMI Calculator')).toHaveClass(/active/);
        await expect(getCard(page, 'BMI Calculator').locator('#weight')).toBeVisible();
    });
});
