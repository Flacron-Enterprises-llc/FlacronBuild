    // cypress/support/commands.js
/*
    Cypress.Commands.add('selectRandomOption', { prevSubject: 'element' }, (subject) => {
      cy.wrap(subject)
        .find('option')
        .its('length')
        .then((optionsCount) => {
          // Generate a random index, excluding the first option if it's a placeholder
          const randomIndex = Cypress._.random(1, optionsCount - 1); 
          cy.wrap(subject).select(randomIndex);
        });
    });

    */

        Cypress.Commands.add('selectRandomOption', (selector) => {
      cy.get(selector)
        .find('option')
        .its('length')
        .then((optionsLength) => {
          // Generate a random index, excluding the first "Please select" option if present
          const randomIndex = Cypress._.random(1, optionsLength - 1); 
          cy.get(selector).select(randomIndex);
        });
    });

    

