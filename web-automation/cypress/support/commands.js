// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Source - https://stackoverflow.com/a/73089764
// Posted by Alapan Das
// Retrieved 2025-11-18, License - CC BY-SA 4.0
import 'cypress-file-upload';
require('cypress-delete-downloads-folder').addCustomCommand();

Cypress.Commands.add('readPdfContent', (filePath, options = {}) => {
  const timeout = options.timeout || 30000;
  const startTime = Date.now();

  const readPdf = () => {
    return cy.task('readPdf', filePath).then(pdfText => {
      if (pdfText && pdfText.length > 0) {
        return pdfText;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`PDF at ${filePath} was empty after ${timeout}ms`);
      }

      return Cypress.Promise.delay(1000).then(readPdf);
    });
  };

  return readPdf();
});