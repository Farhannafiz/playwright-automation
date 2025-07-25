// login.js

const { TOTP } = require('totp-generator');
const { chromium } = require('playwright');

async function loginToDashboard(email, password, otpSecret) {
  const browser = await chromium.launch({ headless: false }); // Set headless: true for background execution
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Your login process logic here
    // ...
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    console.log('Browser will stay open for inspection.');
  }
}

// Export the function so it can be imported in another file
module.exports = { loginToDashboard };
