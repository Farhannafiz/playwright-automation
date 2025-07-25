const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const dayjs = require('dayjs');

const API_ENDPOINT = "http://hype.p-stageenv.xyz/api/v1/internal/promos";

// 🔐 Authorization Token
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZmFyaGFuLm5hZml6QHBhdGhhby5jb20ifSwiaWF0IjoxNzQ4NDI2NjY0LCJleHAiOjE3NDg1MTMwNjR9.JnvcpDYt0n7bi4Zv9YDOnIPYtGWIFbU7Tl1fP8duYoQ";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function generateRandomCode(length = 6) {
    const raw = crypto.randomBytes(length).toString('base64');
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
    console.debug(`[DEBUG] Raw base64: ${raw}, Cleaned: ${clean}`);
    return clean;
}

async function generatePromoCode() {
    const codePrefix = "Test";
    const generatedCode = generateRandomCode();
    const code = codePrefix + generatedCode;

    const payload = {
        discount_type: "percent",
        apply_on_type: "total",
        code: code,
        value: 10,
        max_use_per_user: 1,
        max_usage: 1,
        max_deductible: 120,
        city_id: 0,
        start_date: "2025-06-10T01:00:00+06:00",
        expire_date: "2025-06-15T00:00:00+06:00",
        visible_in_app: false,
        min_order_value: 349
    };

    console.debug(`[DEBUG] Sending payload: ${JSON.stringify(payload, null, 2)}`);

    try {
        const response = await axios.post(API_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_TOKEN
            }
        });

        console.debug(`[DEBUG] Response Status: ${response.status}`);
        return response.status === 201 ? code.toUpperCase() : null;
    } catch (error) {
        console.error(`[ERROR] Failed to create promo code: ${error.message}`);
        if (error.response) {
            console.error(`[ERROR] Status: ${error.response.status}`);
            console.error(`[ERROR] Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        return null;
    }
}

async function main() {
    const input = await askQuestion("How many promo codes do you want to create? ");
    rl.close();

    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) {
        console.error("Please enter a valid integer number!");
        process.exit(1);
    }

    const currentDate = dayjs().format("YYYY-MM-DD");
    const currentDatetime = dayjs().format("YYYY-MM-DD_HH-mm-ss");
    const dir = path.join(__dirname, 'codes', currentDate);
    const csvFile = path.join(dir, `promo_codes_${currentDatetime}.csv`);

    console.debug(`[DEBUG] Output directory: ${dir}`);
    console.debug(`[DEBUG] CSV file path: ${csvFile}`);

    await fs.ensureDir(dir);
    await fs.writeFile(csvFile, "PromoCode\n");

    for (let i = 1; i <= count; i++) {
        console.log(`Generating promo code ${i}...`);
        const promoCode = await generatePromoCode();

        if (promoCode) {
            await fs.appendFile(csvFile, `${promoCode}\n`);
            console.log(`Generated: ${promoCode}`);
        } else {
            console.log(`Failed to generate promo code ${i}.`);
        }
    }

    console.log(`Promo codes have been saved to ${csvFile}`);
}

main();
