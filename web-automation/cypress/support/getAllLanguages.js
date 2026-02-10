Cypress.Commands.add('getAllLanguagesFromStep5', () => {
  cy.get('select[aria-hidden="true"] option')
    .then(($options) => {
      const languages = [...$options].map(opt =>
        opt.value.toLowerCase()
      );

      cy.wrap(languages).as('languages');
    });
});
