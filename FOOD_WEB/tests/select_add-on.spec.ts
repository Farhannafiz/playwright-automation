import { test, expect, chromium, Page, BrowserContext } from '@playwright/test';

test.describe('🛒 Full BFC Order Flow with Customization, Login, Payment & Rating', () => {
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

  const trackOrderStatuses = async () => {
    const trackerItems = new Set<string>();
    let deliveredReached = false;

    for (let i = 0; i < 60; i++) {
      const statuses = await page.$$eval('.tracker-item .st-title', (els) =>
        els.map((el) => el.textContent?.trim() || '')
      );

      for (const status of statuses) {
        if (status && !trackerItems.has(status)) {
          trackerItems.add(status);
          console.log(`🟢 Status updated: ${status}`);
          if (status.toLowerCase().includes('delivered')) {
            deliveredReached = true;
          }
        }
      }

      if (deliveredReached) break;
      await page.waitForTimeout(5000);
    }

    expect(deliveredReached).toBeTruthy();
    console.log('✅ Delivered status reached');
  };

  test('✅ BFC Full Flow: Customize + Login + Payment + Rating', async ({}, testInfo) => {
    testInfo.setTimeout(6 * 60 * 1000); // 6 min

    await page.getByText('Locate Me').click();
    await expect(page.getByText('See Restaurant')).toBeVisible({ timeout: 10000 });
    await page.getByText('See Restaurant').click();

    // Search BFC
    await page.waitForSelector('.restaurants-container .cards-item', { timeout: 10000 });
    const searchInput = page.getByPlaceholder('Search for Restaurants and Dishes');
    await searchInput.click();
    await searchInput.fill('bfc');
    await page.keyboard.press('Enter');

    const bfcRestaurantCard = page.locator('.restaurants-container .card-shadow.restaurant-info h2.title', { hasText: 'BFC' }).first();
    await expect(bfcRestaurantCard).toBeVisible({ timeout: 10000 });
    await bfcRestaurantCard.click();

    // Wait for restaurant to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('BFC');

    // Click Add on first item
    const btnSection = page.locator('.all-restaurants-area .btn-section').first();
    await expect(btnSection).toBeVisible({ timeout: 10000 });
    const addButton = btnSection.locator('button', { hasText: 'Add' });
    await addButton.click();

    // FIXED Add-on Modal logic
    const modal = page.locator('.pt-modal-container');
    await expect(modal).toBeVisible({ timeout: 10000 });

    const addonOption = modal.locator('.addon-radio label').first();
    await expect(addonOption).toBeVisible({ timeout: 5000 });
    await addonOption.click(); // click the label instead of the input directly

    const addToCartButton = modal.locator('.pt-modal-footer button', { hasText: 'Add to cart' });
    await expect(addToCartButton).toBeEnabled({ timeout: 5000 });
    await addToCartButton.click();

    // Go to Checkout
    const checkoutBtn = page.getByText('Go to Checkout');
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();
    await expect(page.getByText('Order Confirmation')).toBeVisible({ timeout: 10000 });

    // Place Order (should trigger login modal)
    const placeOrderBtn = page.locator('.page-btn-area >> button:has-text("Place Order")');
    await expect(placeOrderBtn).toBeVisible({ timeout: 8000 });
    await placeOrderBtn.click();

    const loginModal = page.locator('.webauth__modal');
    await expect(loginModal).toBeVisible({ timeout: 8000 });

    console.log('✅ Login modal appeared');

    // Login
    const phoneInput = page.locator('.vti__input');
    await phoneInput.fill('');
    await phoneInput.type('+8801788164131');
    await page.locator('text=Send OTP').click();

    const otpInputs = page.locator('input[type="tel"]');
    const validOtp = '222222';
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(validOtp[i]);
    }

    await page.locator('text=Continue').click();
    const deliverTo = page.locator('.deliver-title');
    await expect(deliverTo).toBeVisible({ timeout: 8000 });
    console.log('✅ Logged in successfully');

    // Confirm order
    const placeOrderAfterLogin = page.locator('.page-btn-area >> button:has-text("Place Order")');
    await expect(placeOrderAfterLogin).toBeVisible({ timeout: 10000 });
    await placeOrderAfterLogin.click();

    const confirmModal = page.locator('.pt-modal-body');
    await expect(confirmModal).toBeVisible({ timeout: 8000 });

    const confirmBtn = page.locator('button.rounded-md.pt-btn-primary.pt-btn.right-btn', { hasText: 'Confirm' });
    await confirmBtn.click();

    const orderPlacedModal = page.locator('.flex.flex-col.items-center');
    await expect(orderPlacedModal).toBeVisible({ timeout: 10000 });
    await expect(orderPlacedModal.getByText('Order Placed')).toBeVisible();
    console.log('✅ Order placed');

    const seeOrderDetailsBtn = page.locator('button.rounded-md.pt-btn-full.pt-btn-primary.pt-btn', {
      hasText: 'See Order Details'
    });
    await expect(seeOrderDetailsBtn).toBeVisible({ timeout: 10000 });
    await seeOrderDetailsBtn.click();

    await expect(page.getByText('Order Status')).toBeVisible({ timeout: 10000 });
    console.log('✅ Navigated to Order Details');

    // Track status
    await trackOrderStatuses();

    // Payment
    const paymentModal = page.locator('.pt-modal-header:has(h1:text("Payment"))');
    await expect(paymentModal).toBeVisible({ timeout: 60000 });

    const confirmPaymentBtn = page.locator('button.rounded-md.pt-btn-full.pt-btn-primary.pt-btn', { hasText: 'Confirm payment' });
    await expect(confirmPaymentBtn).toBeVisible({ timeout: 10000 });

    try {
      await confirmPaymentBtn.click();
    } catch {
      await confirmPaymentBtn.click({ force: true });
    }
    console.log('✅ Payment confirmed');

    // Success modal
    const paymentSuccessModal = page.locator('.pt-modal-body div.text-xl', { hasText: 'Payment Successful!' });
    await expect(paymentSuccessModal).toBeVisible({ timeout: 10000 });

    const okayBtn = page.locator('button.rounded-md.pt-btn-full.pt-btn-primary.pt-btn', { hasText: 'Okay' });
    await okayBtn.click();
    console.log('✅ Payment Success modal handled');

    // Rating modal
    const ratingModal = page.locator('.pt-modal-header h1', { hasText: 'Rating' });
    await expect(ratingModal).toBeVisible({ timeout: 10000 });

    console.log('🎉 Full flow complete — including Add-on, Login, Payment, and Rating!');
  });

  test.afterEach(async () => {
    await context.close();
  });
});
