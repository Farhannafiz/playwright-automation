const axios = require("axios");
const fs = require("fs-extra");
const readline = require("readline");
const dayjs = require("dayjs");
const Jimp = require("jimp");
const crypto = require("crypto");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const getBase64Image = async (text) => {
  const image = new Jimp(400, 200, 0xffffffff); // white background
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  image.print(font, 10, 80, text);
  return await image.getBase64Async(Jimp.MIME_JPEG);
};

const generateTitle = (index) => {
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `Test-${randomPart}`;
};

const createOffers = async (count) => {
  const authToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZmFyaGFuLm5hZml6QHBhdGhhby5jb20ifSwiaWF0IjoxNzQ4OTQzMDM0LCJleHAiOjE3NDkwMjk0MzR9.N8zsIyKgE9Hkh2XbZ8oxTjhng4OxBbR5hS_-cmKsLEY";
  const baseURL = "https://hype.p-stageenv.xyz/api/v1/internal/app-cards";

  for (let i = 0; i < count; i++) {
    const title = generateTitle(i);
    const image = await getBase64Image(title);

    const startDate = dayjs().add(1, "day").format("YYYY-MM-DD");
    const endDate = dayjs().add(7 + i, "day").format("YYYY-MM-DD");

    const payload = {
      title,
      code: "",
      restaurant_id: "0d4651b4-ebc4-4b6b-9a53-399fb212fdcf",
      description: "",
      city_ids: [1],
      is_active: true,
      placements: [
        "3fe6873e-f36d-4342-8735-493984cd00be",
        "3eab2f4d-6b92-47cf-ad27-265b5e2508be",
      ],
      priority: 1,
      schedules: [
        {
          start_date: startDate,
          end_date: endDate,
          daily_start_time_sec: 21600, // 6 AM
          daily_end_time_sec: 68400, // 7 PM
          operating_days: [0, 1, 2, 3, 4, 5, 6],
        },
      ],
      tags: ["6daf4456-79ff-4dbd-9496-69acce4b6a61"],
      user_group: 133,
      xtrip_count: null,
      image,
    };

    try {
      const response = await axios.post(baseURL, payload, {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });

      console.log(`✅ Created offer: ${title}`);
    } catch (err) {
      console.error(`❌ Failed to create offer ${title}:`, err.response?.data || err.message);
    }
  }
};

(async () => {
  const countStr = await askQuestion("How many offers do you want to create? ");
  const count = parseInt(countStr);
  rl.close();

  if (!isNaN(count) && count > 0) {
    await createOffers(count);
  } else {
    console.log("❌ Invalid number.");
  }
})();