const { defineConfig } = require("cypress");

module.exports = defineConfig({

   projectId: "oanr4m",

  reporter: "cypress-mochawesome-reporter",
  video: true,

  reporterOptions: {
    overwrite: false,
    html: true,
    json: true,                 // Generate JSON report
    reportDir: "cypress/reports/html",
    reportFilename: "[name]"+ `report-${new Date().toISOString().replace(/[:.]/g, '-')}`,  
    reportPageTitle: "Test Report",
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: true
  },

   e2e: {
  //  chromeWebSecurity: false,
     experimentalStudio: true,
     defaultCommandTimeout: 17000, // 15 seconds for commands like cy.get()
     pageLoadTimeout: 70000,       // 60 seconds for page loads
     requestTimeout: 15000,        // 15 seconds for API requests
     responseTimeout: 16000,       // 15 seconds for API responses

    setupNodeEvents(on, config) {
      // Register Mochawesome plugin
      require("cypress-mochawesome-reporter/plugin")(on);

    }
  },

  env: {
    URL: "https://flacronbuild.com/"
  }
});
