const axios = require('axios');
const FormData = require('form-data');
const readline = require('readline');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

// CONFIG
const OUTPUT_FILE = path.resolve(__dirname, 'created_restaurants.csv');
const API_URL = 'https://food-ops.p-stageenv.xyz/api/v1/restaurants';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZmFyaGFuLm5hZml6QHBhdGhhby5jb20ifSwiaWF0IjoxNzUwMDU1NDYzLCJleHAiOjE3NTAxNDE4NjN9.1KxHIMwlH8rwpwgdEvKysrS40DB2v_FlagezMZNx8JA'; // 🔐 Replace with your token

// Random utils
function getRandomParseId() {
  return Math.floor(10000000 + Math.random() * 90000000);
}

function getRandomRestaurantName() {
  const adjectives = ['Spicy', 'Tasty', 'Golden', 'Sizzling', 'Royal', 'Happy', 'Cozy', 'Savory'];
  const nouns = ['Kitchen', 'Bistro', 'Diner', 'Grill', 'Eatery', 'Corner', 'Tavern', 'Shack'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}


function getDeliverySettings() {
  return {
    min_delivery_fee: 30,
    delivery_discount_percent: 10,
    long_distance_fee_enabled: true,
    mov_delivery_fee: 50,
    mov_delivery_fee_threshold: 350,
    mov_hour_locked_delivery_fee: null,
    mov_hour_locked_delivery_fee_threshold: null,
  };
}

async function createRestaurant() {
  const parseId = getRandomParseId();
  const restaurantName = getRandomRestaurantName();
  const deliverySettings = getDeliverySettings();

  const form = new FormData();
  form.append('parse_id', parseId.toString());
  form.append('city', '1'); // Adjust city ID if needed
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

  // Append delivery settings
  for (const [key, value] of Object.entries(deliverySettings)) {
    if (value === null) {
      form.append(key, '');
    } else {
      form.append(key, value.toString());
    }
  }

  try {
    const res = await axios.post(API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: AUTH_TOKEN,
      },
    });

    const data = res.data || {};
    // You may need to adjust data extraction depending on actual API response structure
    return {
      id: data.id || data.data?.id || '', // fallback options
      name: restaurantName,
      parse_id: parseId,
      ...deliverySettings,
    };
  } catch (err) {
    console.error('❌ Failed to create restaurant:', err.response?.data || err.message);
    return null;
  }
}

async function askNumberOfRestaurants() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('🔢 How many restaurants do you want to create? ', (answer) => {
      rl.close();
      resolve(parseInt(answer, 10));
    });
  });
}

async function run() {
  const numRestaurants = await askNumberOfRestaurants();

  if (isNaN(numRestaurants) || numRestaurants <= 0) {
    console.error('❌ Invalid number of restaurants.');
    return;
  }

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
      { id: 'mov_delivery_fee_threshold', title: 'MOV Threshold' },
    ],
  });

  const records = [];

  for (let i = 0; i < numRestaurants; i++) {
    console.log(`🚀 Creating restaurant ${i + 1} of ${numRestaurants}...`);
    const result = await createRestaurant();
    if (result) records.push(result);
  }

  await csvWriter.writeRecords(records);
  console.log(`✅ Done! ${records.length} restaurants created and saved to ${OUTPUT_FILE}`);
}

run();
