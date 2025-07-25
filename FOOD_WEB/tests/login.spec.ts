import { test, expect, chromium } from '@playwright/test';

test.describe('Phone Login Flow', () => {
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

  test('Login modal opens and phone number is entered', async () => {
    const loginButton = page.locator('text=Login/Register');
    await loginButton.click();

    const phoneInput = page.locator('.vti__input');
    await expect(phoneInput).toBeVisible();
    await phoneInput.type('1788164131'); // Keep the default +880

    await page.locator('text=Send OTP').click();
    await expect(page.locator('text=Enter OTP')).toBeVisible({ timeout: 10000 });

    console.log('✅ Test 1: Phone number entered and OTP modal appeared');
  });

  test('Invalid OTP shows error', async () => {
    await page.locator('text=Login/Register').click();
    await page.locator('.vti__input').type('1788164131');
    await page.locator('text=Send OTP').click();

    const otpInputs = page.locator('input[type="tel"]');
    const invalidOtp = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(invalidOtp[i]);
    }

    await page.locator('button:has-text("Continue")').click();

    const errorMsg = page.locator('text=The code is incorrect. Please try again.');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });

    console.log('✅ Test 2: Invalid OTP rejected');
  });

  test('Valid OTP logs in and redirects to dashboard', async () => {
    await page.locator('text=Login/Register').click();
    await page.locator('.vti__input').type('1788164131');
    await page.locator('text=Send OTP').click();

    const otpInputs = page.locator('input[type="tel"]');
    const validOtp = '222222';
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(validOtp[i]);
    }

    await page.locator('button:has-text("Continue")').click();

    const locateMeButton = page.locator('text=Locate Me');
    await locateMeButton.click();
    
    await expect(page.locator('text=See Restaurant')).toBeVisible({ timeout: 8000 });
    await page.locator('text=See Restaurant').click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Restaurants Near')).toBeVisible({ timeout: 15000 });

    console.log('✅ Test 3: Valid OTP accepted, redirected to dashboard');
  });

  test.afterEach(async () => {
    await context.close();
  });
});
