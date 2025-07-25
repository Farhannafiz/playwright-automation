import { test, expect, chromium, Page, BrowserContext } from '@playwright/test';

test.describe('Item Counter Flow', () => {
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

  const addItem = async (btnSection: ReturnType<Page['locator']>) => {
    const addButton = btnSection.locator('button', { hasText: 'Add' });
    await addButton.click();
    return btnSection.locator('.pt-counter');
  };

  const goToCheckout = async () => {
    const checkoutBtn = page.getByText('Go to Checkout');
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();
    await expect(page.getByText('Order Confirmation')).toBeVisible({ timeout: 10000 });
  };


  test('✅ Add item, go to checkout, and verify login required for placing order', async () => {
    const btnSection = await goToFirstRestaurant();
    await addItem(btnSection);
    await goToCheckout();
    await page.waitForTimeout(5000);

    const placeOrderBtn = page.locator('.page-btn-area >> button:has-text("Place Order")');
    await expect(placeOrderBtn).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(5000);
    await placeOrderBtn.click();

    const loginModal = page.locator('.webauth__modal');
    await expect(loginModal).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(5000);

    console.log('✅ Login/Register modal appeared → Order cannot be placed without login');
  });


  test.afterEach(async () => {
    await context.close();
  });
});
