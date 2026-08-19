// @ts-check
/**
 * Mock data + route interception for the Art Piece of the Day card.
 *
 * The card talks to a Cloudflare Pages Function (/api/artic), which in turn
 * queries the Art Institute of Chicago's public API. This mock stands in for
 * that response so the E2E test is deterministic and needs no network access.
 */

const ARTWORK = {
  id: 129884,
  title: 'A Sunday on La Grande Jatte',
  artist_display: 'Georges Seurat',
  date_display: '1884-1886',
  medium_display: 'Oil on canvas',
  credit_line: 'Helen Birch Bartlett Memorial Collection',
  image_id: 'ed92aa7c-4a2f-1a2e-6d3f-e8b4c9d1a2b3',
};

/**
 * Install a route mock for the artic API endpoint on the given page.
 * @param {import('@playwright/test').Page} page
 */
async function mockArticApi(page) {
  await page.route('**/api/artic**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ARTWORK) })
  );
}

module.exports = { ARTWORK, mockArticApi };
