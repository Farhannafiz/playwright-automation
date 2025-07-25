const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const storageStatePath = 'auth.json'; // Path to save the session state
  let browser;

  try {
    // Launch the browser
    browser = await chromium.launch({ headless: false }); // Set headless: true for background execution

    // Create a new browser context
    const context = await browser.newContext();

    // Load saved session if available
    if (fs.existsSync(storageStatePath)) {
      console.log('Loading saved session...');
      await context.addCookies(JSON.parse(fs.readFileSync(storageStatePath, 'utf8')));
    }

    // Create a new page
    const page = await context.newPage();

    // Navigate to the website
    await page.goto('https://pathshala-dashboard.p-stageenv.xyz/');
    console.log('Page loaded successfully.');

    // Wait for the Google login button to appear
    const loginButton = page.locator('div[role="button"]:has(#button-label)');
    await loginButton.waitFor({ state: 'visible' }); // Wait for the button to be visible

    // Click the Google login button
    await loginButton.click();
    console.log('Google login button clicked.');

    // Handle popup for Google login
    const [googleLoginPage] = await Promise.all([
      page.waitForEvent('popup'), // Wait for the popup to open
      loginButton.click(), // Trigger the popup
    ]);

    // Wait for the email input field
    await googleLoginPage.waitForSelector('input[type="email"]', { timeout: 30000 });
    await googleLoginPage.fill('input[type="email"]', 'farhan.nafiz@pathao.com'); // Replace with your email
    await googleLoginPage.locator('button:has-text("Next")').click();
    console.log('Email entered and "Next" clicked.');

    // Wait for the password input field
    await googleLoginPage.waitForSelector('input[type="password"]', { timeout: 30000 });
    await googleLoginPage.fill('input[type="password"]', 'F@rhannafiz  /;001'); // Replace with your password
    await googleLoginPage.locator('button:has-text("Next")').click();
    console.log('Password entered and "Next" clicked.');

    // Optional: Wait for 2FA or manual steps
    console.log('Complete any 2FA steps manually if required.');
    await googleLoginPage.waitForTimeout(30000); // Adjust the timeout for 2FA completion

    // Save the session cookies for future use
    const cookies = await context.cookies();
    fs.writeFileSync(storageStatePath, JSON.stringify(cookies, null, 2));
    console.log('Session state saved to auth.json.');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
})();
