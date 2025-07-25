import { test, expect, chromium } from '@playwright/test';

// Utility function to scroll and click if necessary
async function scrollAndClick(page, selectorText: string) {
  const element = page.locator(`text=${selectorText}`);
  await element.scrollIntoViewIfNeeded();
  await expect(element).toBeVisible();
  await element.click();
}

test.describe('Landing Page Flow with Geolocation', () => {
  let context;
  let page;

  test.beforeEach(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      permissions: ['geolocation'],
      geolocation: { latitude: 23.793703338298076, longitude: 90.411103189457 },
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await context.grantPermissions(['geolocation'], {
      origin: 'https://food-web.p-stageenv.xyz'
    });

    await page.goto('https://food-web.p-stageenv.xyz');
    await page.waitForTimeout(3000);
  });

  test('Landing_01 Login/Register', async () => {
    await scrollAndClick(page, 'Login/Register');
    await expect(page.locator('.webauth__modal')).toBeVisible();
  });

  test('Landing_02 Enter Address', async () => {
    await scrollAndClick(page, 'Enter your address');
  });

  test('Landing_03 Locate Me Button', async () => {
    await scrollAndClick(page, 'Locate Me');
  });

  test('Landing_04 See Restaurants Button', async () => {
    await page.locator('text=Locate Me').click();
    await expect(page.locator('text=See Restaurant')).toBeVisible({ timeout: 8000 });
    await page.locator('text=See Restaurant').click();
  });

  test('Landing_05 Login to see Save address', async () => {
    await scrollAndClick(page, 'Login to see Save address');
  });

  test('Landing_06 Google Play button', async () => {
    await scrollAndClick(page, 'Google Play');
  });

  test('Landing_07 App Store button', async () => {
    await scrollAndClick(page, 'App Store');
  });

  test('Landing_08 Join as a Partner (Pathao Resto Merchant)', async () => {
    await scrollAndClick(page, 'Join as a Partner');
  });

  test('Landing_09 Google Play button (Browse the Food Web)', async () => {
    await scrollAndClick(page, 'Browse the Food Web');
    await scrollAndClick(page, 'Google Play');
  });

  test('Landing_10 App Store button (Browse the Food Web)', async () => {
    await scrollAndClick(page, 'Browse the Food Web');
    await scrollAndClick(page, 'App Store');
  });

  test('Landing_11 Set your address button', async () => {
    await scrollAndClick(page, 'Set your address');
  });

  test('Landing_12 Join as a Partner (Got a Restaurant?)', async () => {
    await scrollAndClick(page, 'Got a Restaurant?');
    await scrollAndClick(page, 'Join as a Partner');
  });

  test('Landing_13 Become a Foodman', async () => {
    await scrollAndClick(page, 'Become a Foodman');
  });

  test('Landing_14 I\'m a customer (FAQ)', async () => {
    await scrollAndClick(page, "I'm a customer");
  });

  test('Landing_15 I\'m a foodman (FAQ)', async () => {
    await scrollAndClick(page, "I'm a foodman");
  });

  test('Landing_16 Footer buttons click', async () => {
    const footerButtons = page.locator('footer button, footer a');
    const count = await footerButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = footerButtons.nth(i);
      await btn.scrollIntoViewIfNeeded();
      await expect(btn).toBeVisible();
    }
  });

  test.afterEach(async () => {
    await context.close();
  });
});
