const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const FormData = require('form-data');
const dayjs = require('dayjs');

const GROUP_API_ENDPOINT = "https://hype.p-stageenv.xyz/api/v1/internal/groups";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZmFyaGFuLm5hZml6QHBhdGhhby5jb20ifSwiaWF0IjoxNzQ4MzQwNDYxLCJleHAiOjE3NDg0MjY4NjF9.x9APT6EgsCcKVXfjf5LIT6bTkTmbpU_9yudZrlEAP1w";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function generateRandomName(length = 6) {
    const raw = crypto.randomBytes(length).toString('base64');
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
    console.debug(`[DEBUG] Generated raw base64: ${raw}, Cleaned name: ${clean}`);
    return 'Group' + clean;
}

async function createRandomGroup() {
    const groupName = generateRandomName();

    const groupPayload = {
        name: groupName,
        type: "user",
        ids: ["0"]
    };

    console.debug(`[DEBUG] Payload to be sent: ${JSON.stringify(groupPayload, null, 2)}`);

    const form = new FormData();
    form.append('group_ids_as_form', JSON.stringify(groupPayload));

    try {
        console.debug(`[DEBUG] Sending POST request to ${GROUP_API_ENDPOINT}`);
        const response = await axios.post(GROUP_API_ENDPOINT, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': AUTH_TOKEN
            }
        });

        console.debug(`[DEBUG] Received response status: ${response.status}`);
        console.debug(`[DEBUG] Response data: ${JSON.stringify(response.data, null, 2)}`);

        if (response.status === 200) {
            const createdGroup = response.data.group;
            console.log(`Created group: ${createdGroup.name} (ID: ${createdGroup.id})`);
            return createdGroup;
        } else {
            console.warn(`[WARN] Unexpected response status: ${response.status}`);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to create group: ${error.message}`);
        if (error.response) {
            console.error(`[ERROR] Response status: ${error.response.status}`);
            console.error(`[ERROR] Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }

    return null;
}

async function main() {
    const input = await askQuestion("How many random user groups do you want to create? ");
    rl.close();

    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) {
        console.error("Please enter a valid number!");
        process.exit(1);
    }

    const currentDate = dayjs().format("YYYY-MM-DD");
    const currentDatetime = dayjs().format("YYYY-MM-DD_HH-mm-ss");
    const dir = path.join(__dirname, 'groups', currentDate);
    const filePath = path.join(dir, `groups_created_${currentDatetime}.csv`);

    console.debug(`[DEBUG] Output directory: ${dir}`);
    console.debug(`[DEBUG] Output file path: ${filePath}`);

    await fs.ensureDir(dir);
    await fs.writeFile(filePath, "GroupName,GroupID\n");

    for (let i = 1; i <= count; i++) {
        console.log(`Creating group ${i}...`);
        const group = await createRandomGroup();
        if (group) {
            await fs.appendFile(filePath, `${group.name},${group.id}\n`);
            console.debug(`[DEBUG] Group ${i} saved to CSV.`);
        } else {
            console.warn(`[WARN] Failed to create group ${i}.`);
        }
    }

    console.log(`✅ Group creation complete. CSV saved at: ${filePath}`);
}

main();
