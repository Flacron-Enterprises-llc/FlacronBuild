const { defineConfig } = require("cypress");

module.exports = defineConfig({


   projectId: "oanr4m",


  reporter: "cypress-mochawesome-reporter",
  video: true,

  reporterOptions: {
    overwrite: false,
    html: true,
    json: true,                 // Generate JSON report

    reportDir: "cypress/reports",
    reportFilename:"[name]" +`report-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    reportPageTitle: "Test Report",
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: true
  },

  projectId: "2hxc8g",

  e2e: {
    chromeWebSecurity: false,
    experimentalStudio: true,

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
     defaultCommandTimeout: 30000,
    pageLoadTimeout: 60000,
    viewportWidth: 1280,
    viewportHeight: 720,

    setupNodeEvents(on, config) {
      // Register Mochawesome plugin
      require("cypress-mochawesome-reporter/plugin")(on);

    }
  },

  env: {
    URL: "https://flacronbuild.com/"
  }
});
