const { defineConfig } = require("cypress");

module.exports = defineConfig({

<<<<<<< HEAD
=======
   projectId: "oanr4m",

>>>>>>> cda4089ccc01238200332589c05ec7faac587c47
  reporter: "cypress-mochawesome-reporter",
  video: true,

  reporterOptions: {
    overwrite: false,
    html: true,
    json: true,                 // Generate JSON report
<<<<<<< HEAD
    reportDir: "cypress/reports",
    reportFilename:"[name]" +`report-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    reportPageTitle: "Test Report",
    embeddedScreenshots: true,
    inlineAssets: true
  },

  projectId: "2hxc8g",

  e2e: {
    chromeWebSecurity: false,
    experimentalStudio: true,
=======
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
>>>>>>> cda4089ccc01238200332589c05ec7faac587c47

    setupNodeEvents(on, config) {
      // Register Mochawesome plugin
      require("cypress-mochawesome-reporter/plugin")(on);
<<<<<<< HEAD
=======

>>>>>>> cda4089ccc01238200332589c05ec7faac587c47
    }
  },

  env: {
    URL: "https://flacronbuild.com/"
  }
});
