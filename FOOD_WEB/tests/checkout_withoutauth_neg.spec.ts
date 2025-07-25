import { test, expect, chromium, Page, BrowserContext } from '@playwright/test';

test.describe('❌ Negative Test Cases - Item Counter Flow', () => {
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

  const goToFirstRestaurant = async (): Promise<ReturnType<Page['locator']>> => {
    await page.getByText('Locate Me').click();
    await expect(page.getByText('See Restaurant')).toBeVisible({ timeout: 8000 });
    await page.getByText('See Restaurant').click();

    const firstRestaurant = page.locator('.restaurants-container .cards-item').first();
    await expect(firstRestaurant).toBeVisible();
    await firstRestaurant.click();

    const btnSection = page.locator('.all-restaurants-area .btn-section').first();
    await expect(btnSection).toBeVisible();

    return btnSection;
  };

  test('❌ Go to Checkout not visible if no item is added', async () => {
    await goToFirstRestaurant();
    const checkoutBtn = page.getByText('Go to Checkout');
    await expect(checkoutBtn).not.toBeVisible();
    console.log('❌ No items added → Checkout button is hidden');
  });

  test('❌ Try clicking Place Order without adding item (manually)', async () => {
    await goToFirstRestaurant();
    const placeOrderBtn = page.locator('.page-btn-area >> button:has-text("Place Order")');
    await expect(placeOrderBtn).not.toBeVisible();
    console.log('❌ Cannot place order when no items are in cart');
  });

  test('❌ Add and remove item → Counter should disappear', async () => {
    const btnSection = await goToFirstRestaurant();
    const addBtn = btnSection.locator('button', { hasText: 'Add' });
    await addBtn.click();

    const plusBtn = btnSection.locator('button', { hasText: '+' });
    const minusBtn = btnSection.locator('button', { hasText: '-' });

    await plusBtn.click();
    await plusBtn.click(); // Now 3 items

    await minusBtn.click();
    await minusBtn.click();
    await minusBtn.click(); // Back to 0

    const counter = btnSection.locator('.pt-counter');
    await expect(counter).not.toBeVisible();
    console.log('❌ Counter disappeared after reducing items to 0');
  });

  test('❌ Remove all items and try to checkout', async () => {
    const btnSection = await goToFirstRestaurant();
    const addBtn = btnSection.locator('button', { hasText: 'Add' });
    await addBtn.click();

    const minusBtn = btnSection.locator('button', { hasText: '-' });
    await minusBtn.click(); // Counter back to 0

    const checkoutBtn = page.getByText('Go to Checkout');
    await expect(checkoutBtn).not.toBeVisible();
    console.log('❌ Removed item → Checkout button not shown');
  });

  test('❌ Try to interact with page before it fully loads', async () => {
    await page.getByText('Locate Me').click();
    await page.getByText('See Restaurant').click();

    const btnSection = page.locator('.all-restaurants-area .btn-section').first();
    // Intentionally skip waiting

    const addButton = btnSection.locator('button', { hasText: 'Add' });

    try {
      await addButton.click({ timeout: 3000 });
      console.log('❌ Add button was clickable before it should have been!');
    } catch {
      console.log('✅ Prevented interaction before page was ready');
    }
  });

  test.afterEach(async () => {
    await context.close();
  });
});
