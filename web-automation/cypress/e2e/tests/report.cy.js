describe('Test Login Flow for Insurance Adjuster' ,()=>{
   it('Login with valid Email and Password', ()=>{
      /* ==== Generated with Cypress Studio ==== */
      cy.visit('https://flacronbuild.com/');
      cy.get('#\\:r8\\:-form-item').clear('c');
      cy.get('#\\:r8\\:-form-item').type('con');
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('#\\:rk\\:-form-item').clear('p');
      cy.get('#\\:rk\\:-form-item').type('pak');
      cy.get('#\\:rl\\:-form-item').clear();
      cy.get('#\\:rl\\:-form-item').type('kara');
      cy.get('#\\:rm\\:-form-item').clear();
      cy.get('#\\:rm\\:-form-item').type('13210');
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('.grid > :nth-child(1) > .flex')
      cy.get('.grid > :nth-child(2) > .flex')
      cy.get('#\\:rr\\:-form-item').clear('2');
      cy.get('#\\:rr\\:-form-item').type('22');
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get(':nth-child(1) > .rounded-t-2xl').click();
      cy.get(':nth-child(1) > .rounded-t-2xl > .text-lg').should('have.text', 'con');
      cy.get(':nth-child(1) > .flex.text-sm').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-500').should('have.text', '19 Jan 2026');
      cy.get(':nth-child(1) > .flex.text-sm').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-700').should('have.text', 'Role: homeowner');
      cy.get(':nth-child(1) > .flex.text-sm').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-blue-600').should('have.text', '📄 PDF Available');
      cy.get(':nth-child(1) > .gap-3 > .hover\\:bg-blue-100').should('be.visible');
      cy.get(':nth-child(1) > .gap-3 > .hover\\:bg-green-100').should('be.visible');
      cy.get(':nth-child(1) > .gap-3 > .hover\\:bg-red-100').should('be.visible');
      /* ==== End Cypress Studio ==== */
   })

   /* ==== Test Created with Cypress Studio ==== */
   it('test2', function() {
      /* ==== Generated with Cypress Studio ==== */
      cy.visit('https://flacronbuild.com/');
      cy.get('.space-y-8 > .space-y-6').click();
      cy.get('#\\:r8\\:-form-item').clear('ne');
      cy.get('#\\:r8\\:-form-item').type('new');
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('#\\:rk\\:-form-item').clear('pa');
      cy.get('#\\:rk\\:-form-item').type('pak');
      cy.get('#\\:rl\\:-form-item').clear();
      cy.get('#\\:rl\\:-form-item').type('kara');
      cy.get('#\\:rm\\:-form-item').clear();
      cy.get('#\\:rm\\:-form-item').type('121212');
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('#\\:rr\\:-form-item').clear('23');
      cy.get('#\\:rr\\:-form-item').type('23');
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('.hover\\:bg-accent').click();
      cy.get('.grid > :nth-child(1) > .flex').should('be.visible');
      cy.get('.grid > :nth-child(2) > .flex').should('be.visible');
      cy.get('.grid > :nth-child(1) > .flex').should('have.text', 'Retail Store');
      cy.get('.grid > :nth-child(2) > .flex').should('be.visible');
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('.pt-6 > .flex > .inline-flex').click();
      cy.get('.grid > .font-semibold').should('be.visible');
      cy.get('.opacity-90').should('be.visible');
      cy.get('.bg-white > .mb-8').should('be.visible');
      cy.get(':nth-child(1) > .rounded-t-2xl').click();
      cy.get(':nth-child(1) > .rounded-t-2xl > .text-lg').should('be.visible');
      cy.get(':nth-child(1) > .rounded-t-2xl > .text-lg').click();
      cy.get(':nth-child(1) > .rounded-t-2xl > .text-lg').click();
      cy.get(':nth-child(1) > .rounded-t-2xl > .text-lg').should('have.text', 'new');
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-500').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-500').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-500').should('have.text', '19 Jan 2026');
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-700').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-700').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-neutral-700').should('have.text', 'Role: homeowner');
      cy.get(':nth-child(1) > .flex.text-sm > .text-blue-600').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-blue-600').click();
      cy.get(':nth-child(1) > .flex.text-sm > .text-blue-600').should('have.text', '📄 PDF Available');
      cy.get(':nth-child(1) > .gap-3 > .hover\\:bg-blue-100').should('be.visible');
      cy.get(':nth-child(1) > .gap-3 > .hover\\:bg-green-100').should('be.visible');
      cy.get(':nth-child(1) > .gap-3 > .hover\\:bg-red-100').should('be.visible');
      /* ==== End Cypress Studio ==== */
   });
})
