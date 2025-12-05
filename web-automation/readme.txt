# **Login Automation Tests (Cypress + POM)**

This repository contains end-to-end **Login Automation Tests** for **4 user roles** using **Cypress** with the **Page Object Model (POM)** structure.
Each role has separate test scripts with multiple scenarios, including:

* Login with a valid email & password
* Login with an invalid email & password
* Email & password field validations
* Build-time HTML reports with videos
* Step-by-step logs inside HTML reports

---

## **Key Features**

### ✅ **Page Object Model (POM) Architecture**

All locators and reusable methods are stored in dedicated page classes for clean, maintainable code.

### ✅ **Role-Based Test Scripts**

Each user role has a dedicated test file and npm script for easy execution.

### ✅ **HTML Reports + Videos**

Each test run automatically generates:

* HTML report
* Video recording
* Execution logs inside the HTML report

### ✅ **GitHub Actions – CI/CD**

From the **Actions** tab, users can:

* Run each role’s login test from pre-configured workflows
* Execute tests on **multiple browsers** (Chrome, Firefox, Edge)
* Run all tests in **parallel**
* Download test artifacts (HTML reports + videos) from the workflow Summary page
* Open the Cypress Cloud run link directly from GitHub Actions at run time

---

## **Available Workflows (GitHub Actions)**

* **Login – Role 1 (Chrome, Firefox, Edge)**
* **Login – Role 2 (Chrome, Firefox, Edge)**
* **Login – Role 3 (Chrome, Firefox, Edge)**
* **Login – Role 4 (Chrome, Firefox, Edge)**
* **Run All Tests in Parallel (Multi-Browser)**

Each workflow contains:

* Cypress Cloud link (Live Run) :  https://cloud.cypress.io/projects/h3npwd/runs/
* Downloadable Reports + Videos

---

## **How to Download & Run Locally**

### **1. Clone the Repository**

```bash
git clone https://github.com/<your-repo-name>.git
cd <project-folder>
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Run Tests for Each Role**

Example:

```bash
npm run role1-login
npm run role2-login
npm run role3-login
npm run role4-login
```

### **4. Run All Login Tests (Parallel / Multi-Browser)**

```bash
npm run all-login-tests
```

### **5. View Reports**

After each run, open:

```
/cypress/reports/html/index.html
```

Videos are available under:

```
/cypress/videos/
```

---

## **Cypress Cloud**

All runs are synced to Cypress Cloud.
You can view live execution, screenshots, logs, and analytics.

---

## **Folder Structure**

```
/cypress
  /e2e
    role1-login.cy.js
    role2-login.cy.js
    role3-login.cy.js
    role4-login.cy.js
  /pages (POM)
  /videos
  /reports
/config
/tests
```

---

## **Tech Stack**

* **Cypress**
* **Page Object Model (POM)**
* **GitHub Actions**
* **Cypress Cloud**
* **Multi-browser testing** (Chrome, Firefox, Edge)

---

## **Author**

**Hina – QA Engineer**
Automating login flows with clean POM structure & CI/CD workflows.
