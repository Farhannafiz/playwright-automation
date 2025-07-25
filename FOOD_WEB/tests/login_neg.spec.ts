import { test, expect, chromium } from '@playwright/test';

test.describe('Negative Phone Login Flow Tests', () => {
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
    await page.locator('text=Login/Register').click();
  });

  test('Blank phone number keeps Send OTP disabled', async () => {
    const sendOtpButton = page.locator('text=Send OTP');
    await expect(sendOtpButton).toBeDisabled();
    console.log('✅ Negative Test 1: Blank phone input keeps Send OTP disabled');
  });

  test('Invalid phone number format keeps Send OTP disabled', async () => {
    const phoneInput = page.locator('.vti__input');
    await phoneInput.type('123'); // Invalid short number
    const sendOtpButton = page.locator('text=Send OTP');
    await expect(sendOtpButton).toBeDisabled();
    console.log('✅ Negative Test 2: Invalid phone number keeps Send OTP disabled');
  });

  test('Incomplete OTP input is rejected', async () => {
    const phoneInput = page.locator('.vti__input');
    await phoneInput.type('1788164131');
    await page.locator('text=Send OTP').click();

    const otpInputs = page.locator('input[type="tel"]');
    await otpInputs.nth(0).fill('1');
    await otpInputs.nth(1).fill('2');
    // only 2 of 6 digits

    const sendOtpButton = page.locator('text=Continue');
    await expect(sendOtpButton).toBeDisabled();
    console.log('✅ Negative Test 3: Incomplete OTP keeps Continue button disabled');
  });

  test('Non-numeric OTP input is blocked or ignored', async () => {
    const phoneInput = page.locator('.vti__input');
    await phoneInput.type('1788164131');
    await page.locator('text=Send OTP').click();

    const otpInputs = page.locator('input[type="tel"]');
    const fakeOtp = ['a', '%', '@', '!', 'b', 'z'];
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(fakeOtp[i]);
    }

    const sendOtpButton = page.locator('text=Continue');
    await expect(sendOtpButton).toBeDisabled();
    console.log('✅ Negative Test 4: Non-numeric OTP keeps Continue button disabled');
  });

  test('Multiple failed OTP attempts do not log in', async () => {
    const phoneInput = page.locator('.vti__input');
    await phoneInput.type('1788164131');
    await page.locator('text=Send OTP').click();

    const otpInputs = page.locator('input[type="tel"]');
    const wrongOtp = ['1', '2', '3', '4', '5', '6'];

    for (let attempt = 0; attempt < 3; attempt++) {
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(wrongOtp[i]);
      }
      await page.locator('button:has-text("Continue")').click();
      await expect(page.locator('text=The code is incorrect')).toBeVisible();
      await page.waitForTimeout(1000);
    }

    console.log('✅ Negative Test 5: Multiple wrong OTP attempts didn’t bypass login');
  });

  test('Valid OTP entered without "Locate Me" does not redirect to dashboard', async () => {
    const phoneInput = page.locator('.vti__input');
    await phoneInput.type('1788164131');
    await page.locator('text=Send OTP').click();

    const otpInputs = page.locator('input[type="tel"]');
    const validOtp = '222222';
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(validOtp[i]);
    }

    await page.locator('button:has-text("Continue")').click();

    await page.waitForTimeout(4000); // Give time for potential redirect
    await expect(page.locator('text=Restaurants Near')).not.toBeVisible();

    console.log('✅ Negative Test 6: Login without location did not redirect to dashboard');
  });

  test.afterEach(async () => {
    await context.close();
  });
});
