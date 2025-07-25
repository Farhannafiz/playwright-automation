import { test, expect, chromium, Page } from '@playwright/test';

test.describe('Item Counter Flow', () => {
  let context;
  let page: Page;

  test.beforeEach(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      slowMo: 300, // makes actions visible
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

  // ✅ Shared helper to reach the first restaurant page
  async function goToFirstRestaurant(): Promise<ReturnType<Page['locator']>> {
    await page.getByText('Locate Me').click();
    await expect(page.getByText('See Restaurant')).toBeVisible({ timeout: 8000 });
    await page.getByText('See Restaurant').click();

    const firstRestaurant = page.locator('.restaurants-container .cards-item').first();
    await expect(firstRestaurant).toBeVisible();
    await firstRestaurant.click();

    const btnSection = page.locator('.all-restaurants-area .btn-section').first();
    await expect(btnSection).toBeVisible();

    return btnSection;
  }

  test('Add button click creates counter and sets quantity to 1', async () => {
    console.log('Looking for Locate Me button...');
    await page.locator('text=Locate Me').click();
    console.log('Locate Me clicked, waiting for See Restaurant...');
    await page.waitForSelector('text=See Restaurant', { timeout: 10000 });

    const seeRestaurant = page.locator('text=See Restaurant');
    await seeRestaurant.click();

    console.log('Clicking the first restaurant...');
    const firstRestaurant = page.locator('.restaurants-container .cards-item').first();
    await firstRestaurant.waitFor({ state: 'visible', timeout: 10000 });
    await firstRestaurant.click();

    console.log('Waiting for the Add button...');
    const btnSection = page.locator('.all-restaurants-area .btn-section').first();
    await btnSection.waitFor({ state: 'visible', timeout: 10000 });
    await expect(btnSection).toBeVisible();

    const addButton = btnSection.locator('button', { hasText: 'Add' });
    await addButton.click();

    console.log('Waiting for counter to appear and verify the quantity is 1...');
    const counter = btnSection.locator('.pt-counter');
    await counter.waitFor({ state: 'visible', timeout: 10000 });
    const count = counter.locator('.count');
    await expect(count).toHaveText('1');

    console.log('✅ Add button created pt-counter and showed quantity = 1');
  });

  test('✅ Plus button increments count from 1 to 2', async () => {
    const btnSection = await goToFirstRestaurant();

    const addButton = btnSection.locator('button', { hasText: 'Add' });
    await addButton.click();

    const plusBtn = btnSection.locator('.pt-counter .icon-ic_plus');
    const count = btnSection.locator('.pt-counter .count');

    await plusBtn.click();
    await expect(count).toHaveText('2');
    console.log('✅ Plus button incremented count to 2');
  });

  test('✅ Minus from 2 -> 1, then 1 -> back to Add', async () => {
    const btnSection = await goToFirstRestaurant();
  
    // Click Add → counter = 1
    const addButton = btnSection.locator('button', { hasText: 'Add' });
    await addButton.click();
  
    const counter = btnSection.locator('.pt-counter');
    const count = counter.locator('.count');
    const minusBtn = counter.locator('.icon-ic_minus');
    const plusBtn = counter.locator('.icon-ic_plus');
  
    // Increase to 2
    await plusBtn.click();
    await expect(count).toHaveText('2');
    console.log('✅ Count is now 2');
  
    // Decrease to 1
    await minusBtn.click();
    await expect(count).toHaveText('1');
    console.log('✅ Count decreased to 1');
  
    // Decrease to 0 → counter disappears, Add button appears
    await minusBtn.click();
    await expect(counter).toHaveCount(0);
    await expect(addButton).toBeVisible();
    await page.waitForTimeout(5000);
    console.log('✅ Counter hidden, Add button visible again');
  });

  test('✅ Add item, then go to checkout page', async () => {
    const btnSection = await goToFirstRestaurant();

    // Click Add → counter = 1
    const addButton = btnSection.locator('button', { hasText: 'Add' });
    await addButton.click();

    // Wait for Go to Checkout to appear and click
    const checkoutButton = page.getByText('Go to Checkout');
    await expect(checkoutButton).toBeVisible({ timeout: 10000 });
    await checkoutButton.click();

    // Confirm checkout loaded
    await expect(page.getByText('Order Confirmation')).toBeVisible({ timeout: 10000 });
    console.log('✅ Order Confirmation page loaded');
    await page.waitForTimeout(5000);
  });
  

  test('✅ Add item, go to checkout, and verify login required for placing order', async () => {
    const btnSection = await goToFirstRestaurant();
  
    // Step 1: Click Add → counter = 1
    const addButton = btnSection.locator('button', { hasText: 'Add' });
    await addButton.click();
  
    // Step 2: Go to Checkout page
    const checkoutBtn = page.getByText('Go to Checkout');
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();
  
    // Step 3: Ensure we landed on Order Confirmation page
    await expect(page.getByText('Order Confirmation')).toBeVisible({ timeout: 10000 });
    console.log('✅ Order Confirmation page loaded');
  
    // Step 4: Click Place Order button inside .page-btn-area
    const placeOrderBtn = page.locator('.page-btn-area >> button:has-text("Place Order")');
    await expect(placeOrderBtn).toBeVisible({ timeout: 8000 });
    await placeOrderBtn.click();
  
    // Step 5: Check if Login/Register modal appears
  const loginModal = page.locator('.webauth__modal');
  await expect(loginModal).toBeVisible();
  await page.waitForTimeout(5000);
  
    console.log('✅ Login/Register modal appeared → Order cannot be placed without login');
     // Optional: visual confirmation
  });
  

  test.afterEach(async () => {
    await context.close();
  });
});
