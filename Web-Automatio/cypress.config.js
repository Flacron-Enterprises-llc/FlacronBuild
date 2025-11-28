const { defineConfig } = require("cypress");

module.exports = defineConfig({

  reporter: 'cypress-mochawesome-reporter',
  video: true,
  
  reporterOptions: {
    overwrite: false, 
    html: true,
    json: true, // Generate JSON report
    reportFilename: '[name]',  // Use ONLY [timestamp]
    reportPageTitle: 'Test Report',
    embeddedScreenshots: true,
    inlineAssets: true,

    
  },
    projectId: "2hxc8g",

  e2e: {

     chromeWebSecurity: false,
  
    experimentalStudio:true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
       require('cypress-mochawesome-reporter/plugin')(on);
        // Register the "log" task for cy.task()
      on("task", {
        log(message) {
          console.log(message);
          return null; // must return something
        }
      });

      return config;
    },
       
    },
  

  env:{

    URL:'https://flacronbuild.com/'

  },
});
