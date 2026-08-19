// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('QR code generator', () => {
  test('generates a preview from text input', async ({ page }) => {
    await page.goto('/QR-Code.html');

    await page.locator('#qrText').fill('https://smallapp.tools');

    await expect(page.locator('[data-preview-img]')).toHaveAttribute('src', /^data:image\/png/);
    await expect(page.locator('[data-download]')).toBeVisible();
  });

  test('clears the preview when input is emptied', async ({ page }) => {
    await page.goto('/QR-Code.html');

    await page.locator('#qrText').fill('hello');
    await expect(page.locator('[data-preview-img]')).toHaveAttribute('src', /^data:image\/png/);

    await page.locator('#qrText').fill('');
    await expect(page.locator('[data-preview]')).toBeHidden();
    await expect(page.locator('[data-download]')).toBeHidden();
  });

  test('generates a Wi-Fi QR code from the form', async ({ page }) => {
    await page.goto('/QR-Code.html');

    await page.getByRole('button', { name: 'Wi-Fi' }).click();
    await page.locator('[data-wifi-ssid]').fill('MyNet');
    await page.locator('[data-wifi-password]').fill('p@ss;word');

    await expect(page.locator('[data-preview-img]')).toHaveAttribute('src', /^data:image\/png/);
    await expect(page.locator('[data-download]')).toBeVisible();
  });

  test('downloads a PNG file', async ({ page }) => {
    await page.goto('/QR-Code.html');

    await page.locator('#qrText').fill('https://smallapp.tools');
    await expect(page.locator('[data-preview-img]')).toHaveAttribute('src', /^data:image\/png/);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-download]').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^qr-code-\d{8}\.png$/);
  });
});
