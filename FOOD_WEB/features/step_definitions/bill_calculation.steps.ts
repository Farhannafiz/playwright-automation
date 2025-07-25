import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, expect, request, Browser, BrowserContext, Page, APIRequestContext } from '@playwright/test';

setDefaultTimeout(60 * 1000); // increase timeout if needed

let browser: Browser;
let context: BrowserContext;
let page: Page;
let apiContext: APIRequestContext;

Given('I launch the Pathao Food website', async function () {
  browser = await chromium.launch({ headless: false, slowMo: 200 });

  context = await browser.newContext({
    permissions: ['geolocation'],
    geolocation: { latitude: 23.793703338298076, longitude: 90.421103189457 },
    viewport: { width: 1280, height: 720 },
  });

  page = await context.newPage();
  await page.goto('https://food-web.p-stageenv.xyz');
});

When('I locate myself and go to the first restaurant', async function () {
  await page.getByText('Locate Me').click();
  await page.getByText('See Restaurant').click();

  const firstRestaurant = page.locator('.restaurants-container .cards-item').first();
  await firstRestaurant.waitFor({ state: 'visible' });
  await firstRestaurant.click();
  await page.waitForLoadState('networkidle');
});

When('I add the first item to the cart', async function () {
  const addButton = page.locator('.all-restaurants-area .btn-section button').first();
  await addButton.click();

  const counter = page.locator('.pt-counter').first();
  await expect(counter).toHaveText('1');
});

When('I proceed to checkout', async function () {
  const checkoutBtn = page.getByText('Go to Checkout');
  await checkoutBtn.waitFor({ state: 'visible' });
  await checkoutBtn.click();
  await page.waitForLoadState('networkidle');
});

Then('the bill values should match between frontend, API, and calculation', async function () {
  const parse = (text: string) => parseFloat(text.replace(/[^\d.]/g, ''));

  // Ensure elements are loaded
  await expect(page.locator('.subtotal .value')).toBeVisible();
  await expect(page.locator('.deliveryCharge .value')).toBeVisible();
  await expect(page.locator('.discount .value')).toBeVisible();
  await expect(page.locator('.total .value')).toBeVisible();

  const subtotalText = await page.locator('.subtotal .value').innerText();
  const deliveryText = await page.locator('.deliveryCharge .value').innerText();
  const discountText = await page.locator('.discount .value').innerText();
  const totalText = await page.locator('.total .value').innerText();

  const subtotal = parse(subtotalText);
  const delivery = parse(deliveryText);
  const discount = parse(discountText);
  const totalFrontend = parse(totalText);

  const calculatedTotal = subtotal + delivery - discount;
  expect(totalFrontend).toBeCloseTo(calculatedTotal, 1);

  // Use API from browser context to preserve session
  const response = await context.request.get('https://food-api.p-stageenv.xyz/order/checkout', {
    headers: { 'x-city-id': '1' }
  });

  const apiData = await response.json();
  const apiSubtotal = apiData.data?.subTotal;
  const apiDelivery = apiData.data?.deliveryCharge;
  const apiDiscount = apiData.data?.totalDiscount;
  const apiTotal = apiData.data?.totalPrice;

  expect(apiSubtotal).toBeCloseTo(subtotal, 1);
  expect(apiDelivery).toBeCloseTo(delivery, 1);
  expect(apiDiscount).toBeCloseTo(discount, 1);
  expect(apiTotal).toBeCloseTo(totalFrontend, 1);
});

