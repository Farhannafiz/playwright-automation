import { test, expect, chromium } from '@playwright/test';

test.describe('Landing Page Flow with Geolocation', () => {
  let context;
  let page;

  test.beforeEach(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      permissions: ['geolocation'],
      geolocation: { latitude: 23.793703338298076, longitude: 90.411103189457 }, // Dhaka
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    // Allow geolocation permission for your domain
    await context.grantPermissions(['geolocation'], {
      origin: 'https://food-web.p-stageenv.xyz'
    });

    await page.goto('https://food-web.p-stageenv.xyz');
    await page.waitForTimeout(3000);
  });

  test('Landing page loads correctly', async () => {
    console.log('✅ Test 1: Landing page loaded');
    await expect(page).toHaveTitle('Pathao Food: Best Online Food Delivery Service in Bangladesh');
  });

  test('Login modal opens successfully', async () => {
    console.log('✅ Test 2: Opening login modal');
    const loginButton = page.locator('text=Login/Register');
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    const loginModal = page.locator('.webauth__modal');
    await expect(loginModal).toBeVisible({ timeout: 10000 });
    console.log('✅ Test 2: Login modal opened');
  });

  test('Locate Me and navigate to restaurant dashboard', async () => {
    console.log('✅ Test 3: Clicking Locate Me button');
  
    const locateMeButton = page.locator('text=Locate Me');
    await expect(locateMeButton).toBeVisible();
    await locateMeButton.click();
  
    // Wait for "See Restaurant" to confirm location success
    const seeRestaurantBtn = page.locator('text=See Restaurant');
    await expect(seeRestaurantBtn).toBeVisible({ timeout: 8000 });
    console.log('📍 Location detected, See Restaurant button appeared');
  
    await seeRestaurantBtn.click();
  
    await expect(page.locator('text=Collection')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Restaurants Near')).toBeVisible();
    await expect(page.locator('text=Sort by')).toBeVisible();
    await expect(page.locator('text=All Restaurants')).toBeVisible();
  
    console.log('✅ Test 4: Dashboard elements verified');
  });

  test('Dashboard elements appear after location flow', async () => {
    console.log('✅ Test 4: Repeating flow to reach dashboard');
  
    const locateMeButton = page.locator('text=Locate Me');
    await locateMeButton.click();
  
    const seeRestaurantBtn = page.locator('text=See Restaurant');
    await seeRestaurantBtn.click();
  
    await expect(page.locator('text=Collection')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Restaurants Near')).toBeVisible();
    await expect(page.locator('text=Sort by')).toBeVisible();
    await expect(page.locator('text=All Restaurants')).toBeVisible();
  
    console.log('✅ Test 4: Dashboard verified after See Restaurant');

  });

  test('Locate Me, verify dashboard, and search for pizza', async () => {
    console.log('✅ Test 3: Clicking Locate Me button');
  
    const locateMeButton = page.locator('text=Locate Me');
    await expect(locateMeButton).toBeVisible();
    await locateMeButton.click();
  
    const seeRestaurantBtn = page.locator('text=See Restaurant');
    await expect(seeRestaurantBtn).toBeVisible({ timeout: 8000 });
    console.log('📍 Location detected, See Restaurant button appeared');
  
    await seeRestaurantBtn.click();
  
    // Dashboard element checks
    await expect(page.locator('text=Collection')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Restaurants Near')).toBeVisible();
    await expect(page.locator('text=Sort by')).toBeVisible();
    await expect(page.locator('text=All Restaurants')).toBeVisible();
  
    console.log('✅ Test 4: Dashboard elements verified');
  
    // 🔍 Search action
    const searchInput = page.getByPlaceholder('Search for Restaurants and dishes');
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.fill('pizza');
    await page.keyboard.press('Enter');
  
    // ⏳ Wait for search result (adjust this locator based on your UI)
    const resultsArea = page.locator('.restaurants-area.search-result-area');
  await expect(resultsArea).toBeVisible({ timeout: 8000 });

  const searchTitle = resultsArea.locator('.search-title-area');
  await expect(searchTitle.first()).toContainText("Results with 'pizza'");
  
    console.log('✅ Test 5: Search results for "pizza" are visible');
  });  
  

  test.afterEach(async () => {
    await context.close();
  });
});
