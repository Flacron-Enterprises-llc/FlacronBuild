const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-extraction");
const fsExtra = require("fs-extra");

module.exports = defineConfig({
  reporter: "cypress-mochawesome-reporter",
  video: true,

  reporterOptions: {
    reportDir: "cypress/reports/html",
    reportFilename: "[name]-report",
    embeddedScreenshots: true,
    inlineAssets: true,
  },

  projectId: "2hxc8g",

  e2e: {
    testIsolation: true,
    retries:{
      runMode:2,
      openMode: 0
    },
    downloadsFolder: "cypress/downloads",
    chromeWebSecurity: false,
    defaultCommandTimeout: 15000,

    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);

      on("task", {

        // ✅ Delete folder safely
        deleteFolder(folderName) {
          return new Promise((resolve) => {
            fs.rm(folderName, { recursive: true, force: true }, (err) => {

              if (err) {
                console.warn("Cleanup skipped:", err.message);
              } else {
                console.log("Folder deleted:", folderName);
              }

              resolve(null);
            });
          });
        },

        // ✅ Read PDF
        async readPdf(filePath) {
          const fullPath = path.resolve(filePath);

          if (!fs.existsSync(fullPath)) {
            throw new Error("File not found: " + fullPath);
          }

          const dataBuffer = fs.readFileSync(fullPath);
          const data = await pdf(dataBuffer);

          return data.text;
        },

        // ✅ Get newest PDF
        getLatestPdf(folder) {
          const files = fs.readdirSync(folder)
            .filter(f => f.endsWith(".pdf"))
            .map(f => ({
              name: f,
              path: path.join(folder, f),
              time: fs.statSync(path.join(folder, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

          return files.length ? files[0].path : null;
        },

        // ✅ Clear downloads folder
clearDownloadsFolder(folderPath = "cypress/downloads") {

  const fullPath = path.resolve(folderPath);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const deleteFiles = async () => {

    if (!fs.existsSync(fullPath)) return null;

    const files = fs.readdirSync(fullPath);

    for (const file of files) {

      const filePath = path.join(fullPath, file);

      let attempts = 5;

      while (attempts > 0) {
        try {
          fs.unlinkSync(filePath);
          console.log("✅ Deleted:", file);
          break;
        } catch (err) {

          if (attempts === 1) {
            console.warn("⚠ Skipped (locked):", file);
          }

          await sleep(500);
          attempts--;
        }
      }
    }

    return null;
  };

  return deleteFiles();
}


      });

      return config;
    }
  },

  env: {
    URL: "https://flacronbuild.com/"
  }
});
