// @ts-check
const { test, expect } = require('@playwright/test');

const TOOLS = [
  { name: 'Basic Calculator', href: 'Calculator.html' },
  { name: 'BMI Calculator', href: 'Calculator-BMI.html' },
  { name: 'Mortgage Calculator', href: 'Calculator-Mortgage.html' },
  { name: 'Retirement Calculator', href: 'Calculator-Retirement.html' },
  { name: 'Image Compression', href: 'Image-Compression.html' },
  { name: 'Weather Dashboard', href: 'Weather.html' },
];

test.describe('Landing page navigation', () => {
  test('loads the AppHub landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AppHub/);
    await expect(page.locator('h1')).toContainText('AppHub');
  });

  test('every tool card links to its page', async ({ page }) => {
    await page.goto('/');
    for (const tool of TOOLS) {
      const card = page.locator('.card', { hasText: tool.name });
      await expect(card).toBeVisible();
      const link = card.getByRole('link', { name: /Open|Calculate|Plan|Compress|Check/ });
      await expect(link).toHaveAttribute('href', tool.href);
    }
  });

  test('each tool page loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    for (const tool of TOOLS) {
      await page.goto(tool.href);
      await expect(page).toHaveTitle(/./);
      await expect(page.locator('body')).toBeVisible();
    }

    expect(errors).toEqual([]);
  });
});
