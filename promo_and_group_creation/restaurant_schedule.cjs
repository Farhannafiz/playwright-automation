const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const { createObjectCsvWriter } = require('csv-writer');
const csvParser = require('csv-parser');

// CONFIG
const OUTPUT_FILE = path.resolve(__dirname, 'created_restaurants.csv');
const UPDATED_OUTPUT_FILE = path.resolve(__dirname, 'created_restaurants_with_schedules.csv');

const RESTAURANT_API_URL = 'https://food-ops.p-stageenv.xyz/api/v1/restaurants';
const SCHEDULE_API_URL = 'https://food-ops.p-stageenv.xyz/api/v1/schedules';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZmFyaGFuLm5hZml6QHBhdGhhby5jb20ifSwiaWF0IjoxNzQ4OTQ5NDgwLCJleHAiOjE3NDkwMzU4ODB9.vxlXHemSvhQoakyqOdbp-c2MEJw1N5W2jhXwlX8LGfk'; // Replace with your token

// Utils
function getRandomParseId() {
  return Math.floor(10000000 + Math.random() * 90000000);
}

function getRandomRestaurantName() {
  const adjectives = ['Spicy', 'Tasty', 'Golden', 'Sizzling', 'Royal', 'Happy', 'Cozy', 'Savory'];
  const nouns = ['Kitchen', 'Bistro', 'Diner', 'Grill', 'Eatery', 'Corner', 'Tavern', 'Shack'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

function getDeliverySettings() {
  return {
    min_delivery_fee: 30,
    delivery_discount_percent: 10,
    long_distance_fee_enabled: true,
    mov_delivery_fee: 50,
    mov_delivery_fee_threshold: 350,
    mov_hour_locked_delivery_fee: null,
    mov_hour_locked_delivery_fee_threshold: null
  };
}

async function createRestaurant() {
  const parseId = getRandomParseId();
  const restaurantName = getRandomRestaurantName();
  const deliverySettings = getDeliverySettings();

  const form = new FormData();
  form.append('parse_id', parseId.toString());
  form.append('city', '1');
  form.append('name', restaurantName);
  form.append('address', 'GULSHAN');
  form.append('visible_in_app', 'true');
  form.append('is_flagged', 'false');
  form.append('is_partner', 'false');
  form.append('phone', '01777777777');
  form.append('latitude', '23.79355239868164');
  form.append('longitude', '90.41094970703125');
  form.append('tags', '[]');
  form.append('badges', '[{"id":1,"name":"TEST"}]');
  form.append('radius_promotion', 'false');
  form.append('is_supershop', 'false');
  form.append('is_tong', 'false');
  form.append('is_pharma', 'false');
  form.append('is_vat_inclusive', 'false');
  form.append('is_sc_inclusive', 'false');
  form.append('is_sd_inclusive', 'false');
  form.append('merchant_type', 'REGULAR');
  form.append('merchant_store_id', '');

  for (const [key, value] of Object.entries(deliverySettings)) {
    if (value !== null && value !== undefined) {
      form.append(key, String(value));
    }
  }

  try {
    const res = await axios.post(RESTAURANT_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: AUTH_TOKEN
      }
    });
    const data = res.data || {};
    return {
      id: data.id || '',
      name: restaurantName,
      parse_id: parseId,
      ...deliverySettings
    };
  } catch (err) {
    console.error('❌ Failed to create restaurant:', err.response?.data || err.message);
    return null;
  }
}

async function createSchedule(restaurantId) {
  if (!restaurantId) {
    console.error('❌ No restaurant ID provided for schedule creation');
    return false;
  }

  const schedulePayload = {
    restaurant_id: restaurantId,
    schedules: [
      {
        day: "Wednesday",
        opening_time: "11:00:00",
        closing_time: "19:59:00"
      }
    ]
  };

  try {
    await axios.post(SCHEDULE_API_URL, schedulePayload, {
      headers: {
        Authorization: AUTH_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (err) {
    console.error(`❌ Failed to create schedule for restaurant ID ${restaurantId}:`, err.response?.data || err.message);
    return false;
  }
}

async function askNumberOfRestaurants() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question('🔢 How many restaurants do you want to create? ', answer => {
      rl.close();
      resolve(parseInt(answer, 10));
    });
  });
}

// STEP 1: Create restaurants and save CSV
async function createRestaurants(num) {
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: [
      { id: 'id', title: 'Restaurant ID' },
      { id: 'name', title: 'Name' },
      { id: 'parse_id', title: 'Parse ID' },
      { id: 'min_delivery_fee', title: 'Min Delivery Fee' },
      { id: 'delivery_discount_percent', title: 'Discount (%)' },
      { id: 'long_distance_fee_enabled', title: 'Long Distance Fee Enabled' },
      { id: 'mov_delivery_fee', title: 'MOV Fee' },
      { id: 'mov_delivery_fee_threshold', title: 'MOV Threshold' }
    ]
  });

  const records = [];

  for (let i = 0; i < num; i++) {
    console.log(`🚀 Creating restaurant ${i + 1} of ${num}...`);
    const restaurant = await createRestaurant();
    if (restaurant && restaurant.id) {
      records.push(restaurant);
    } else {
      console.log('⚠️ Skipped restaurant due to error.');
    }
  }

  await csvWriter.writeRecords(records);
  console.log(`✅ ${records.length} restaurants created and saved to ${OUTPUT_FILE}`);
  return records;
}

// STEP 2: Read CSV, create schedules, save new CSV with schedule info
async function createSchedulesForRestaurants() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`❌ CSV file ${OUTPUT_FILE} not found. Run restaurant creation first.`);
    return;
  }

  const restaurants = [];

  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(OUTPUT_FILE)
      .pipe(csvParser())
      .on('data', (row) => {
        restaurants.push(row);
      })
      .on('end', () => {
        resolve();
      })
      .on('error', reject);
  });

  // Add schedule creation status to each restaurant
  for (const r of restaurants) {
    const id = r['Restaurant ID'] || r.id;
    if (!id) {
      console.log('⚠️ Skipping schedule creation: No restaurant ID found in CSV row', r);
      r.schedule_created = 'No ID';
      continue;
    }
    console.log(`⏳ Creating schedule for restaurant ID ${id}...`);
    const success = await createSchedule(id);
    r.schedule_created = success ? 'Yes' : 'No';
  }

  // Write updated CSV with schedule info
  const csvWriter = createObjectCsvWriter({
    path: UPDATED_OUTPUT_FILE,
    header: [
      { id: 'Restaurant ID', title: 'Restaurant ID' },
      { id: 'Name', title: 'Name' },
      { id: 'Parse ID', title: 'Parse ID' },
      { id: 'Min Delivery Fee', title: 'Min Delivery Fee' },
      { id: 'Discount (%)', title: 'Discount (%)' },
      { id: 'Long Distance Fee Enabled', title: 'Long Distance Fee Enabled' },
      { id: 'MOV Fee', title: 'MOV Fee' },
      { id: 'MOV Threshold', title: 'MOV Threshold' },
      { id: 'schedule_created', title: 'Schedule Created' }
    ]
  });

  // Normalize keys to match header
  const normalizedRecords = restaurants.map(r => ({
    'Restaurant ID': r['Restaurant ID'] || r.id,
    'Name': r['Name'] || r.name,
    'Parse ID': r['Parse ID'] || r.parse_id,
    'Min Delivery Fee': r['Min Delivery Fee'] || r.min_delivery_fee,
    'Discount (%)': r['Discount (%)'] || r.delivery_discount_percent,
    'Long Distance Fee Enabled': r['Long Distance Fee Enabled'] || r.long_distance_fee_enabled,
    'MOV Fee': r['MOV Fee'] || r.mov_delivery_fee,
    'MOV Threshold': r['MOV Threshold'] || r.mov_delivery_fee_threshold,
    'schedule_created': r.schedule_created || 'No'
  }));

  await csvWriter.writeRecords(normalizedRecords);
  console.log(`✅ Schedules created for restaurants, saved updated CSV to ${UPDATED_OUTPUT_FILE}`);
}

async function main() {
  const num = await askNumberOfRestaurants();
  if (isNaN(num) || num <= 0) {
    console.error('❌ Invalid number of restaurants.');
    return;
  }

  await createRestaurants(num);
  await createSchedulesForRestaurants();
}

main();
