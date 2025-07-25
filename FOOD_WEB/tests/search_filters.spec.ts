import { test, expect, chromium, Page, BrowserContext } from '@playwright/test';

test.describe('✅ Filter: Above 4.5 Rating Validation', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      slowMo: 300,
      permissions: ['geolocation'],
      geolocation: { latitude: 23.793703338298076, longitude: 90.421103189457 },
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await context.grantPermissions(['geolocation'], {
      origin: 'https://food-web.p-stageenv.xyz'
    });
    await page.goto('https://food-web.p-stageenv.xyz');
  });

  const goToRestaurantList = async () => {
    await page.getByText('Locate Me').click();
    await expect(page.getByText('See Restaurant')).toBeVisible({ timeout: 8000 });
    await page.getByText('See Restaurant').click();
    await page.waitForSelector('.restaurants-container .cards-item', { timeout: 10000 });
  };

  const scrollToLoadAllRestaurants = async () => {
    const scrollStep = 1000;
    let lastHeight = await page.evaluate(() => document.body.scrollHeight);

    for (let i = 0; i < 10; i++) {
      await page.evaluate((scrollStep) => window.scrollBy(0, scrollStep), scrollStep);
      await page.waitForTimeout(1000);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
    }
  };

  test('✅ Filters should return fewer or equal restaurants than original', async () => {
    await goToRestaurantList();
    await scrollToLoadAllRestaurants();

    const restaurantsBefore = await page.locator('.restaurants-container .cards-item').count();
    console.log(`🍽️ Restaurants before filter: ${restaurantsBefore}`);

    // Click on "Above 4.5" filter option
    await page.locator('.radio-box-element.pt-radio-element', { hasText: 'Above 4.5' }).click();

    // Click on "Apply"
    await page.locator('button.rounded-md.pt-btn-primary.pt-btn.right-btn', { hasText: 'Apply' }).click();

    // Wait and scroll after apply
    await page.waitForSelector('.restaurants-container .cards-item', { timeout: 10000 });
    await scrollToLoadAllRestaurants();

    const restaurantsAfter = await page.locator('.restaurants-container .cards-item').count();
    console.log(`🌟 Restaurants after applying "Above 4.5" filter: ${restaurantsAfter}`);

    expect(
      restaurantsAfter,
      '❌ Filtered result returned more restaurants than original — check filter logic'
    ).toBeLessThanOrEqual(restaurantsBefore);

    console.log('✅ Filter behaves as expected');
  });

  test.afterEach(async () => {
    await context.close();
  });
});
