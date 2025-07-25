// login.ts
import { TOTP } from 'totp-generator';
import { chromium } from 'playwright';

const loginToDashboard = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://pathshala-dashboard.p-stageenv.xyz/');
    console.log('Page loaded successfully.');

    const loginButton = page.locator('div[role="button"]:has(#button-label)');
    await loginButton.waitFor({ state: 'visible' });
    await loginButton.click();
    console.log('Google login button clicked.');

    const [googleLoginPage] = await Promise.all([
      page.waitForEvent('popup'),
      loginButton.click(),
    ]);

    await googleLoginPage.waitForSelector('input[type="email"]', { timeout: 30000 });
    await googleLoginPage.fill('input[type="email"]', 'farhan.nafiz@pathao.com');
    await googleLoginPage.locator('button:has-text("Next")').click();
    console.log('Email entered and "Next" clicked.');

    await googleLoginPage.waitForSelector('input[type="password"]', { timeout: 30000 });
    await googleLoginPage.fill('input[type="password"]', 'F@rhannafiz  /;001');
    await googleLoginPage.locator('button:has-text("Next")').click();
    console.log('Password entered and "Next" clicked.');

    await googleLoginPage.locator('button:has-text("Try another way")').click();
    console.log('"Try another way" clicked.');

    const googleAuthButton = googleLoginPage.locator('li.aZvCDf.cd29Sd.zpCp3.SmR8:has-text("Get a verification code from")');
    await googleAuthButton.waitFor({ state: 'visible' });
    await googleAuthButton.click();
    console.log('Google Authenticator app option clicked.');

    await googleLoginPage.waitForTimeout(5000);

    const { otp } = TOTP.generate('5jvnjpu5p2aulxw3jltws3yu65sz6zhz');
    console.log('Generated OTP:', otp);

    const otpField = googleLoginPage.locator('input.whsOnd.zHQkBf');
    console.log('OTP input field located.');

    await otpField.waitFor({ state: 'visible' });
    await otpField.fill(otp);
    console.log('OTP entered into the field.');

    const nextButton = googleLoginPage.locator('button:has-text("Next")');
    await nextButton.click();
    console.log('Next button clicked after entering OTP.');

    await googleLoginPage.waitForTimeout(15000);
    console.log('Login process completed.');

    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    console.log('Browser will stay open for inspection.');
  }
};

export default loginToDashboard;
