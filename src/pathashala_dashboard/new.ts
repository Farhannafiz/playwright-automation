const { TOTP } = require('totp-generator');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Set headless: true for background execution
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the website
    await page.goto('https://pathshala-dashboard.p-stageenv.xyz/');
    console.log('Page loaded successfully.');

    // Wait for the Google login button to appear and click it
    const loginButton = page.locator('div[role="button"]:has(#button-label)');
    await loginButton.waitFor({ state: 'visible' });
    await loginButton.click();
    console.log('Google login button clicked.');

    // Handle popup for Google login
    const [googleLoginPage] = await Promise.all([
      page.waitForEvent('popup'), // Wait for the popup to open
      loginButton.click(), // Trigger the popup
    ]);

    // Wait for the email input field and login with email
    await googleLoginPage.waitForSelector('input[type="email"]', { timeout: 30000 });
    await googleLoginPage.fill('input[type="email"]', 'farhan.nafiz@pathao.com'); // Replace with your email
    await googleLoginPage.locator('button:has-text("Next")').click();
    console.log('Email entered and "Next" clicked.');

    // Wait for the password input field and login with password
    await googleLoginPage.waitForSelector('input[type="password"]', { timeout: 30000 });
    await googleLoginPage.fill('input[type="password"]', 'F@rhannafiz  /;001'); // Replace with your password
    await googleLoginPage.locator('button:has-text("Next")').click();
    console.log('Password entered and "Next" clicked.');

    // Handle "Try another way" if needed
    await googleLoginPage.locator('button:has-text("Try another way")').click();
    console.log('"Try another way" clicked.');

    // Wait for the Google Authenticator option to appear and click it
    const googleAuthButton = googleLoginPage.locator('li.aZvCDf.cd29Sd.zpCp3.SmR8:has-text("Get a verification code from")');
    await googleAuthButton.waitFor({ state: 'visible' });
    await googleAuthButton.click();
    console.log('Google Authenticator app option clicked.');

    // Wait a moment for the OTP input field to appear
    await googleLoginPage.waitForTimeout(5000); // Adjust as necessary for the delay before OTP input

    // Generate OTP using the provided secret key
    const otp = TOTP.generate('5jvnjpu5p2aulxw3jltws3yu65sz6zhz'); // Replace with your actual key
    console.log('Generated OTP:', otp);

    // Wait for the OTP input field and enter the generated OTP
    await googleLoginPage.fill('input[type="text"]', otp); // Assuming the OTP input is a text field
    await googleLoginPage.locator('button:has-text("Next")').click();
    console.log('OTP entered and "Next" clicked.');

    // Optional: Wait for login process to complete
    await googleLoginPage.waitForTimeout(15000); // Adjust as necessary for login time
    console.log('Login process completed.');

    // Wait for the main page to load
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
