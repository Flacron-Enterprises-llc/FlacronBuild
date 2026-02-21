# InsuranceAdjuster Project Comparison Automation

This project is deployed on the **`web-compare-test`** branch. The automation source code is located within the `/web-automation` directory.

## 🚀 Features
- **Project Creation:** Automates the creation of two distinct projects for comparison.
- **PDF Management (Cypress Task):** Uses a custom Node.js task to purge the downloads folder before every test to prevent data collision.
- **Page Object Model (POM):** Organized structure for scalable and maintainable testing.
- **Comparison Logic:** Validates data tables (Drip Edge, Roof Age) and UI elements like the "Compare" and "Back" buttons.

## 📂 File Management
This project utilizes a `deletePdfs` task in `cypress.config.js`.

**To trigger the cleanup in your tests:**
```javascript
beforeEach(() => {
  // Cleans the downloads folder before each test case
  cy.task('deletePdfs', 'cypress/downloads');
});
