# Playwright Automation Projects

This repository contains multiple Playwright-based automation projects structured for clarity and modularity. Each subproject serves a distinct use case or domain, such as restaurant platform automation, dashboard testing, or promo and group creation automation.

---

## 🔧 Project Structure

```
.
├── FOOD_WEB/
│   ├── features/                  # Cucumber feature files
│   ├── tests/                     # Playwright test specs
│   ├── support/                   # Utility and support files
│   ├── playwright-config/         # Playwright configuration
│   ├── package.json               # Node dependencies
│   └── ...
│
├── pathashala_dashboard/
│   ├── login.ts
│   ├── reuse.ts
│   ├── test1.ts
│   └── ...
│
├── promo_and_group_creation/
│   ├── cashback.cjs
│   ├── offer_generate.cjs
│   ├── promo_group.cjs
│   ├── restaurant_creation.cjs
│   ├── restaurant_schedule.cjs
│   ├── generate_group.cjs
│   ├── codes/                     # Generated promo codes
│   └── groups/                    # Generated user groups
│
├── assets/                        # Images used during tests
├── data/                          # CSV and JSON used/generated
├── .github/workflows/            # CI setup (GitHub Actions)
├── .gitignore
├── playwright.config.js
├── tsconfig.json
└── README.md                      # This file
```

---

## 🚀 How to Run

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Playwright Tests

```bash
npx playwright test
```

For the `FOOD_WEB` project:

```bash
cd FOOD_WEB
npx playwright test
```

### 3. Run Cucumber Tests (if used)

```bash
npx cucumber-js
```

---

## 📁 Data & Artifacts

- `data/`: Stores dynamically generated files like promo codes or group info.
- `assets/`: Images and other static files used during UI automation.

---

## 🤖 GitHub Actions

A CI workflow is available at `.github/workflows/playwright.yml` to automate test runs on push/pull requests.

---

## 📌 Notes

- Ensure environment variables or credentials used in scripts are securely handled.
- Folder naming conventions are consistent and camelCase/underscore separated.
- Common functions and configurations are centralized for better reusability.

---

## 🧪 Dependencies

- Playwright
- Cucumber.js
- TypeScript
- Node.js >= 16.x

---

## 👨‍💻 Maintainer

**Farhan Nafiz**  
🔗 [github.com/Farhannafiz](https://github.com/Farhannafiz)

---

## 📜 License

This project is licensed under the MIT License.