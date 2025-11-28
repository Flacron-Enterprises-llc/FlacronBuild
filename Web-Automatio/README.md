 FlacronBuild | Web Signup Automation (Cypress)

Project Overview
This repository contains end-to-end automation for the **Signup Flow of FlacronBuild Web Application**, covering **4 user roles**:

 Role :
 Contractor
 Homeowner
 Inspector
 Insurance Adjuster

The framework is built using Cypress with Page Object Model (POM), Custom Commands, Random Dropdown Selection, and Mochawesome Test Reporting.

Tech Stack & Tools

Feature Tool
 Automation Framework: Cypress 
 Design Pattern: Page Object Model (POM) 
 Reporting: Mochawesome (With Screenshots & Videos) 
 Data Generation: Faker 
 Assertions: Chai + Cypress
 Browser Execution: Chromium / Chrome / Electron 

📁 Folder Structure

Web_Automation/
│── cypress/
│   ├── e2e/
│   │   ├── signup/
│   │   │   ├── contractorSignUp.cy.js
│   │   │   ├── homeownerSignUp.cy.js
│   │   │   ├── inspectorSignUp.cy.js
│   │   │   ├── insuranceAdjusterSignUp.cy.js
│   ├── pages/
│   │   ├── SignUp.js
│   │   ├── choosePlanPage.js
│   │   ├── contractorProfilePage.js
│   │   ├── homeownerProfilePage.js
│   │   ├── inspectorProfilePage.js
│   │   ├── insuranceProfilePage.js
│   ├── support/
│   │   ├── commands.js  # Custom commands (Random dropdown picker)
│   ├── fixtures/
│   │   ├── signUpData.json
│── reports/
│── videos/
│── screenshots/
│── package.json
│── cypress.config.js
│── README.md

Installation & Setup:
 Prerequisites
- Node.js v14+
- Git
- VS Code (recommended)

 📦 Install Dependencies
Run these commands in the project root:
bash
npm init -y 
npm install cypress --save-dev
npm install @faker-js/faker --save-dev
npm install mochawesome mochawesome-merge mochawesome-report-generator --save-dev

🔐 Custom Command: Random Dropdown Picker

A reusable custom command automatically selects a different random option on every test run, simulating human behavior.

📌 Usage example in test
js
cy.randomSelect('select#materialType')

📌 Defined in `commands.js`:
js
Cypress.Commands.add('randomSelect', (locator) => {
    cy.get(locator).then($dropdown => {
        const options = [...$dropdown.find('option')].map(o => o.value).filter(v => v && !v.includes('Select'));
        const randomValue = Cypress._.sample(options);
        cy.get(locator).select(randomValue);
        cy.log("Selected:", randomValue);
    });
});

🧪 Test Coverage

 ✔️ Positive Scenarios:
- End-to-end signup for all 4 roles
- Select plan (Monthly/Yearly)
- Dynamic dropdown random selection
- Validate profile fields
- Successful navigation until the Review Page

 ❌ Negative Scenarios:
- Empty required fields (Next button disabled validation)
- Invalid email format
- Duplicate email validation
- Password length < 6 characters
- Mandatory dropdowns not selected (Next disabled)

▶️ Running Tests

Open Cypress UI
 bash
npx cypress open

Run Test Suite from CLI
```bash
npx cypress run --spec "cypress/e2e/signup/filename.cy.js"
```

Run a Specific Role Signup Test
```bash
npx cypress run --spec "cypress/e2e/signup/contractorSignUp.cy.js"

run by created script from package.json:

npm run test:homewoner-signup-test

You can also use GitHub Action tabs Running Tests Using GitHub Actions


```

📊 Mochawesome Report (HTML + Video + Screenshots)

Generate Final Report
```bash
npx mochawesome-merge reports/*.json > reports/output.json
npx marge reports/output.json
```
Configure Report Auto-Generation (optional)
Add script in `package.json`:
```json
"scripts": {
  "test": "cypress run",
  "report": "mochawesome-merge reports/*.json > reports/output.json && marge reports/output.json"
}
```

Run report:
```bash
npm run report
```

Report should be save with test name along with test run execution time and date.
🧾 Naming Conventions

| Type | Example |
|------|---------|
| Test Files | contractorSignUp.cy.js |
| Branch | web-signup-tests |
| Custom Command | cy.randomSelect() |
| Page Objects | contractorProfilePage.js |

👨‍💻 Author
**Hina S — Senior QA Automation Engineer**


