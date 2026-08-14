// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const FIXTURE = path.join(__dirname, 'fixtures', 'test-image.png');

test.describe('Image compression', () => {
  test('compresses an uploaded image and shows stats', async ({ page }) => {
    await page.goto('/Image-Compression.html');

    await page.locator('#fileInput').setInputFiles(FIXTURE);

    // Original file info is shown.
    await expect(page.locator('#originalFormat')).toHaveText('PNG');
    await expect(page.locator('#originalSize')).not.toHaveText('0 KB');

    // Compression runs automatically on load.
    await expect(page.locator('#compressedImage')).toHaveAttribute('src', /^data:image/);
    await expect(page.locator('#compressedFormat')).toHaveText('JPEG');

    // Stats and controls appear.
    await expect(page.locator('#statsGrid')).toBeVisible();
    await expect(page.locator('#compressionRatio')).not.toHaveText('-');
    await expect(page.locator('#downloadBtn')).toBeVisible();
  });

  test('switching output format recompresses', async ({ page }) => {
    await page.goto('/Image-Compression.html');

    await page.locator('#fileInput').setInputFiles(FIXTURE);
    await expect(page.locator('#compressedImage')).toHaveAttribute('src', /^data:image/);

    await page.getByRole('button', { name: 'WebP' }).click();
    await expect(page.locator('#compressedFormat')).toHaveText('WebP');
    await expect(page.locator('#compressedImage')).toHaveAttribute('src', /^data:image\/webp/);
  });

  test('reset clears the tool', async ({ page }) => {
    await page.goto('/Image-Compression.html');

    await page.locator('#fileInput').setInputFiles(FIXTURE);
    await expect(page.locator('#compressedImage')).toHaveAttribute('src', /^data:image/);

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#statsGrid')).toBeHidden();
    await expect(page.locator('#downloadBtn')).toBeHidden();
  });
});
