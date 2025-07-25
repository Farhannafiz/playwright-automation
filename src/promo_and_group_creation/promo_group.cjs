const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const FormData = require('form-data');
const dayjs = require('dayjs');

const GROUP_API_ENDPOINT = "https://hype.p-stageenv.xyz/api/v1/internal/groups";
const PROMO_API_ENDPOINT = "http://hype.p-stageenv.xyz/api/v1/internal/promos";

const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZmFyaGFuLm5hZml6QHBhdGhhby5jb20ifSwiaWF0IjoxNzUwMDU1NDYzLCJleHAiOjE3NTAxNDE4NjN9.1KxHIMwlH8rwpwgdEvKysrS40DB2v_FlagezMZNx8JA"; // Your token here

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateRandomString(prefix = "Group", length = 6) {
  const raw = crypto.randomBytes(length).toString('base64');
  return prefix + raw.replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
}

async function createGroup() {
  const groupName = generateRandomString("Group");

  const form = new FormData();
  form.append('group_ids_as_form', JSON.stringify({
    name: groupName,
    type: "user",
    ids: ["0"] // Static user ID; adjust if needed
  }));

  try {
    const response = await axios.post(GROUP_API_ENDPOINT, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': AUTH_TOKEN
      }
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`[✔] Group created: ${groupName} (ID: ${response.data.group.id})`);
      return response.data.group;
    } else {
      console.warn(`[!] Unexpected status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`[X] Error creating group: ${error.message}`);
    if (error.response) {
      console.error(`[X] Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

function generatePromoCode() {
  const codePrefix = "Test";
  const generated = generateRandomString("", 6);
  return codePrefix + generated;
}

async function createPromo(groupId) {
  const promoCode = generatePromoCode();

  const payload = {
    discount_type: "percent",
    apply_on_type: "total",
    code: promoCode,
    value: 10,
    max_use_per_user: 1,
    max_usage: 1,
    max_deductible: 120,
    city_id: 0,
    start_date: "2025-07-10T01:00:00+06:00",
    expire_date: "2025-07-15T00:00:00+06:00",
    visible_in_app: false,
    min_order_value: 349,
    user_group: groupId // Use the created group ID here
  };

  try {
    const response = await axios.post(PROMO_API_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
      }
    });

    if (response.status === 201) {
      console.log(`[✔] Promo created: ${promoCode} (ID: ${response.data.id})`);
      return {
        code: promoCode,
        id: response.data.id,
        groupId,
        groupName: response.data.user_group?.name || "N/A"
      };
    } else {
      console.warn(`[!] Unexpected promo response status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`[X] Error creating promo: ${error.message}`);
    if (error.response) {
      console.error(`[X] Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function main() {
  const input = await askQuestion("How many promos/groups do you want to create? ");
  rl.close();

  const count = parseInt(input, 10);
  if (isNaN(count) || count <= 0) {
    console.error("❌ Invalid number.");
    process.exit(1);
  }

  const currentDate = dayjs().format("YYYY-MM-DD");
  const currentDatetime = dayjs().format("YYYY-MM-DD_HH-mm-ss");
  const dir = path.join(__dirname, 'output', currentDate);
  const filePath = path.join(dir, `promos_with_groups_${currentDatetime}.csv`);

  await fs.ensureDir(dir);
  await fs.writeFile(filePath, "PromoCode,PromoID,GroupName,GroupID\n");

  for (let i = 1; i <= count; i++) {
    console.log(`\n--- Processing ${i}/${count} ---`);

    const group = await createGroup();
    if (!group) {
      console.warn(`⚠️ Group creation failed for index ${i}`);
      continue;
    }

    const promo = await createPromo(group.id);
    if (promo) {
      await fs.appendFile(filePath, `${promo.code},${promo.id},${group.name},${group.id}\n`);
    } else {
      console.warn(`⚠️ Promo creation failed for group ID: ${group.id}`);
    }
  }

  console.log(`\n✅ All done. Output saved to: ${filePath}`);
}

main();
