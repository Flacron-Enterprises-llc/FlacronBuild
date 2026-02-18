const path = require('path');

Cypress.Commands.add('verifyPdfDownload', (expectedName) => {
  const downloadsFolder = Cypress.config('downloadsFolder');

  cy.contains('Download PDF')
    .should('be.visible')
    .click();

  cy.wait(2000);

  cy.task('getDownloadedFile', downloadsFolder).then((fileName) => {
    expect(fileName).to.include(expectedName);
    expect(fileName).to.match(/\.pdf$/);

    const filePath = path.join(downloadsFolder, fileName);
    cy.readFile(filePath, 'binary', { timeout: 15000 }).should('exist');
  });
});
