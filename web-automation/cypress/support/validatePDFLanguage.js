import path from 'path';
import { LANGUAGE_KEYWORDS } from './languageKeywords';

Cypress.Commands.add('verifyPdfLanguageFromAlias', () => {
  cy.get('@language').then((language) => {
    cy.task('getDownloadedFile', Cypress.config('downloadsFolder'))
      .then((fileName) => {
        const filePath = path.join(
          Cypress.config('downloadsFolder'),
          fileName
        );

        cy.task('readPdf', filePath).then((pdfText) => {
          const keywords = LANGUAGE_KEYWORDS[language];

          expect(keywords, `Keywords for ${language}`).to.exist;

          keywords.forEach(keyword => {
            expect(pdfText).to.include(keyword);
          });
        });
      });
  });
});
