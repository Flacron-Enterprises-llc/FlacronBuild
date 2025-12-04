const { defineConfig } = require("cypress");

module.exports = defineConfig({
  

   
    reporter: 'cypress-mochawesome-reporter',
    video: true,
    reporterOptions: {
       charts: true,
    overwrite: false,
    html: true,
    json: true,
    reportDir: "cypress/reports/html",
    reportFilename:
      "[name]" +
      `report-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    reportPageTitle: "Login Test Report",
     embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: true,
  },
   projectId: "2hxc8g",


  e2e: {

    experimentalStudio: true,
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 60000,
    requestTimeout: 15000,
    responseTimeout: 15000,
  
    experimentalStudio:true,
    setupNodeEvents(on, config) {
      // Register Mochawesome reporter plugin
      require('cypress-mochawesome-reporter/plugin')(on);

      // Handle chromeWebSecurity logic by browser
      if (config.browser && config.browser.name === "firefox") {
        config.chromeWebSecurity = true;
      } else {
        config.chromeWebSecurity = false;
      }

      return config;
       
    },
  },

  env:{

    URL:'https://flacronbuild.com/'

  },
});
