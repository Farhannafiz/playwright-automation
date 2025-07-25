import { test, expect, chromium, Page, BrowserContext } from '@playwright/test';

test.describe('Bill Calculation Validation', () => {
  let context: BrowserContext;
  let page: Page;
  let billJson: any;

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

  const waitForBillAndValidate = async () => {
    const calculateBillPromise = page.waitForResponse((res) =>
      res.url().includes('/v1/me/foodweb/v6/orders/calculate-bill') && res.status() === 200
    );

    const checkoutBtn = page.getByText('Go to Checkout');
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();

    const billResponse = await calculateBillPromise;
    billJson = await billResponse.json();

    console.log('✅ Calculate Bill API called successfully');
    console.log('💰 API Total Bill:', billJson.bill.total_bill);

    await expect(page.getByText('Order Confirmation')).toBeVisible({ timeout: 10000 });

    await page.locator('.details.ml-2.text-primary').scrollIntoViewIfNeeded();
    await page.locator('.details.ml-2.text-primary').click();

    const receiptModal = page.locator('.pt-modal-container');
    await expect(receiptModal).toBeVisible({ timeout: 5000 });

    const clean = (val: string) => parseFloat(val.replace(/[^\d.-]/g, ''));

    const getAmountFromLabel = async (label: string): Promise<number | null> => {
      try {
        const row = receiptModal.locator('.item-info', { hasText: label });
        await expect(row).toBeVisible({ timeout: 3000 });
        const valueText = await row.locator('div').nth(1).innerText();
        return clean(valueText);
      } catch {
        return null;
      }
    };

    const matchValue = async (label: string, apiValue: number | undefined) => {
      if (apiValue === undefined) return;
      const modalValue = await getAmountFromLabel(label);
      if (modalValue !== null) {
        expect(modalValue).toBeCloseTo(apiValue, 1);
      }
    };

    // Match known values
    await matchValue('Item Price', billJson.bill.item_price);
    await matchValue('VAT(5%)', billJson.bill.vat);
    await matchValue('Restaurant Service Charge', billJson.bill.service_charge);
    await matchValue('Base Fee', billJson.bill.base_delivery_fee);
    await matchValue('Restaurant Discount', billJson.bill.restaurant_discount);

    // Get frontend total bill
    const totalBillText = await receiptModal.locator('.total-bill div').nth(1).innerText();
    const totalBillFrontend = clean(totalBillText);

    // Compute expected total bill from API values
    const b = billJson.bill;
    const calcTotal =
      (b.item_price ?? 0) +
      (b.vat ?? 0) +
      (b.service_charge ?? 0) +
      (b.base_delivery_fee ?? 0) +
      (b.long_distance_fee ?? 0) +
      (b.foodman_tip ?? 0) -
      (b.restaurant_discount ?? 0) -
      (b.promo_discount ?? 0) -
      (b.other_discounts ?? 0) -
      (b.mov_discount_amount ?? 0);

    console.log('🧮 Calculated Total:', calcTotal);
    console.log('🖥️ Frontend Total:', totalBillFrontend);

    expect(totalBillFrontend).toBeCloseTo(calcTotal, 1);
    expect(b.total_bill).toBeCloseTo(calcTotal, 1);

    console.log('✅ Bill matches between frontend, API total, and calculated value');

    await receiptModal.locator('button', { hasText: 'Understood' }).click();
  };

  test('✅ Validate Bill Calculation Equation with API and Frontend', async () => {
    const btnSection = await goToFirstRestaurant();
    await addItem(btnSection);
    await waitForBillAndValidate();
  });

  test.afterEach(async () => {
    await context.close();
  });
});
