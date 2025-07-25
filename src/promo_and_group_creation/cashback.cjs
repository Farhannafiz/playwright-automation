const axios = require("axios");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const authToken =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZmFyaGFuLm5hZml6QHBhdGhhby5jb20ifSwiaWF0IjoxNzQ4OTQzMDM0LCJleHAiOjE3NDkwMjk0MzR9.N8zsIyKgE9Hkh2XbZ8oxTjhng4OxBbR5hS_-cmKsLEY";

// Updated partners list from your data
const partners = [
  { id: 12, name: "EBL" },
  { id: 10, name: "FirstCash" },
  { id: 2, name: "Nagad" },
  { id: 1, name: "Upay" },
  { id: 11, name: "bKash" },
  { id: 3, name: "pathao_pay" },
];

const createCashbacks = async (count, partnerId) => {
  const baseURL = "https://hype.p-stageenv.xyz/api/v1/internal/cashbacks";

  for (let i = 0; i < count; i++) {
    const payload = {
      start_date: "2025-06-11T05:00:00+06:00",
      expire_date: "2025-06-28T05:00:00+06:00",
      city_id: 1,
      partner: partnerId,
      eligible_cards: "",
      campaign_type: "exclusive",
      is_visible_in_app: true,
      value_type: "flat",
      value: 30,
      max_value: 100,
      min_order_value: 350,
      max_use_per_user: 4,
      monthly_limit_per_user: 0,
      maximum_cashback_per_day: 0,
      maximum_cashback_during_campaign: 0,
    };

    console.debug(`DEBUG: Creating cashback #${i + 1} with payload:`, payload);

    try {
      const response = await axios.post(baseURL, payload, {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });
      console.log(`✅ Created cashback #${i + 1} successfully.`);
      console.debug("DEBUG: Response data:", response.data);
    } catch (err) {
      console.error(`❌ Failed to create cashback #${i + 1}:`, err.response?.data || err.message);
    }
  }
};

(async () => {
  console.log("Available partners:");
  partners.forEach((p) => console.log(`- ${p.name}`));

  const partnerInput = await askQuestion("Enter partner name from above list: ");
  const normalizedInput = partnerInput.trim().toLowerCase();

  // Find partner object by name ignoring case
  const partnerObj = partners.find((p) => p.name.toLowerCase() === normalizedInput);

  console.debug(`DEBUG: Raw input "${partnerInput}", normalized to "${normalizedInput}"`);
  console.debug(`DEBUG: Matched partner object:`, partnerObj);

  if (!partnerObj) {
    console.error("❌ Invalid partner name.");
    rl.close();
    return;
  }

  const countStr = await askQuestion("How many cashback entries do you want to create? ");
  const count = parseInt(countStr);
  console.debug(`DEBUG: Number of entries requested: ${count}`);

  if (isNaN(count) || count <= 0) {
    console.error("❌ Invalid number.");
    rl.close();
    return;
  }

  rl.close();
  await createCashbacks(count, partnerObj.id);
})();
