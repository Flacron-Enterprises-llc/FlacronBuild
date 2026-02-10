


describe('Enter and validate data for Homeowner Project' ,()=>{
    
      it('image', function() {
            cy.visit('https://flacronbuild.com/')
            
            cy.get('[name="name"]').click();
            cy.get('[name="name"]').type('image');
            cy.get('#root div.p-8').click();
            cy.get('#root button.hover\\:bg-primary\\/90').click();
            cy.get('[name="location.country"]').click();
            cy.get('[name="location.country"]').type('test');
            cy.get('[name="location.city"]').type('test');
            cy.get('[name="location.zipCode"]').type('111');
            
            cy.get('#root div.border-dashed').click();
            cy.get('#root div.p-8').click();
            cy.get('#root li.flex span').should('have.text', 'roof.jpg (0.01 MB)');
            cy.get('#root button.hover\\:bg-primary\\/90').click();
            cy.get('html').click();
            cy.get('html').click();
            cy.get('[name="roofAge"]').click();
            cy.get('[name="roofAge"]').type('11');
            cy.get('#root button.hover\\:bg-primary\\/90').click();
            cy.get('html').click();
            cy.get('#root button.hover\\:bg-primary\\/90').click();
            cy.get('#root button.hover\\:bg-primary\\/90').click();
            cy.get('#root div.bg-white').should('be.visible');
            cy.get('#root div.opacity-90').should('have.text', 'Your project has been saved successfully.');
            cy.get('#root div.opacity-90').should('have.text', 'Your estimate and PDF report are ready.');
            cy.get('#root div:nth-child(1) > div.rounded-t-2xl > span.truncate').should('have.text', 'image');
            
      });
})