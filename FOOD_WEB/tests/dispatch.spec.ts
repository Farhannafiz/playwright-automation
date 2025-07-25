import { test, expect, chromium, Page, BrowserContext } from '@playwright/test';

test.describe('Item Counter & Order Placement Flow', () => {
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
    await expect(page.getByText('See Restaurant')).toBeVisible({ timeout: 10000 });
    await page.getByText('See Restaurant').click();

    const firstRestaurant = page.locator('.restaurants-container .cards-item').first();
    await expect(firstRestaurant).toBeVisible({ timeout: 10000 });
    await firstRestaurant.click();

    await page.waitForLoadState('networkidle');

    const btnSection = page.locator('.all-restaurants-area .btn-section').first();
    await expect(btnSection).toBeVisible({ timeout: 15000 });

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


  test('✅ Complete order flow from add to order dispatched', async ({}, testInfo) => {
    testInfo.setTimeout(5 * 60 * 1000); // Set timeout to 5 minutes
  
    const btnSection = await goToFirstRestaurant();
    await addItem(btnSection);
    await goToCheckout();
  
    const placeOrderBtn = page.locator('.page-btn-area >> button:has-text("Place Order")');
    await expect(placeOrderBtn).toBeVisible({ timeout: 8000 });
    await placeOrderBtn.click();
  
    const loginModal = page.locator('.webauth__modal');
    await expect(loginModal).toBeVisible({ timeout: 8000 });
  
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
    console.log('✅ User is Logged in');
  
    const placeOrderAfterLogin = page.locator('.page-btn-area >> button:has-text("Place Order")');
    await expect(placeOrderAfterLogin).toBeVisible({ timeout: 10000 });
    await placeOrderAfterLogin.click();
  
    const confirmModal = page.locator('.pt-modal-body');
    await expect(confirmModal).toBeVisible({ timeout: 8000 });
  
    const modalTitle = confirmModal.locator('.modal-title', { hasText: 'Confirm order' });
    await expect(modalTitle).toBeVisible();
  
    const confirmBtn = page.locator('button.rounded-md.pt-btn-primary.pt-btn.right-btn', { hasText: 'Confirm' });
    await confirmBtn.click();
  
    const orderPlacedModal = page.locator('.flex.flex-col.items-center');
    await expect(orderPlacedModal).toBeVisible({ timeout: 10000 });
    await expect(orderPlacedModal.getByText('Order Placed')).toBeVisible();
    console.log('✅ Order placed successfully');
  
    const seeOrderDetailsBtn = page.locator('button.rounded-md.pt-btn-full.pt-btn-primary.pt-btn', {
      hasText: 'See Order Details'
    });
    await expect(seeOrderDetailsBtn).toBeVisible({ timeout: 10000 });
    await seeOrderDetailsBtn.click();
  
    await expect(page.getByText('Order Status')).toBeVisible({ timeout: 10000 });
    console.log('✅ Navigated to Order Details Page');
  
    await page.waitForTimeout(10000);
  
    const dispatchMsg = page.locator('.st-title.text-base.font-medium', {
      hasText: 'Pathao Hero is going to place the order'
    });
  
    await expect(dispatchMsg).toBeVisible({ timeout: 60000 });
    console.log('✅ Order is dispatched');
  });
  // <-- test timeout set to 5 minutes

  test.afterEach(async () => {
    // Leave this commented during debugging
    // await context.close();
  });
});
