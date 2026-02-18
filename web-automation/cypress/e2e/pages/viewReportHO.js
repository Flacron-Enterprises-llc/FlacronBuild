class viewReport{
        //Locators
    

    weblocators={
      
    projectTitle: 'h1:has-text("Project Report")',
    projectName: '.space-y-2 > :nth-child(1) > .text-neutral-900',
    role: '.space-y-2 > :nth-child(2) > .text-neutral-900',
    location: '.space-y-2 > :nth-child(3) > .text-neutral-900',
    date: '.space-y-2 > :nth-child(4) > .text-neutral-900',
    download: '.rounded-lg > .inline-flex',
    projectInfo: 'h2:has-text("Project Info")',
    structireType: '.grid > :nth-child(1) > .text-neutral-900',
    roofAge: '.grid > :nth-child(3) > .text-neutral-900',
    felt: ':nth-child(5) > .text-neutral-900',
    dripAge: ':nth-child(7) > .text-neutral-900',
    homeownerName: ':nth-child(9) > .text-neutral-900',
    language: ':nth-child(11) > .text-neutral-900',
    roofPitch: '.grid > :nth-child(2) > .text-neutral-900',  
    materialayer: '.grid > :nth-child(4) > .text-neutral-900',
    iceWather: ':nth-child(6) > .text-neutral-900',
    gutter: ':nth-child(8) > .text-neutral-900',
    email: ':nth-child(10) > .text-neutral-900',
    currancy: ':nth-child(12) > .text-neutral-900'


    }

    validateProjectName(){
 
   cy.get('@projectName').then( projectName=> {
      cy.get(this.weblocators.projectName , { timeout: 20000 }).should('contain.text', projectName);
    });


    }

    validateRole(){

        
   cy.get('@mrole').then( role=> {
      cy.get(this.weblocators.role , { timeout: 20000 }).should('contain.text', role);
    });


    }

    validateLocation(){

        cy.get('@city' + ','+ '@country').then( location => {
      cy.get(this.weblocators.location , { timeout: 20000 }).should('contain.text', location);
    });



    }

    validateDate(){

      cy.get('@date').then( date => {
      cy.get(this.weblocators.date , { timeout: 20000 }).should('contain.text', date);
    });


    }

    validateDownloadButton(){

        cy.get(this.weblocators.download).should('be.visible').click()


    }

    validateStructureType(){

         cy.get('@structureType').then( structureType => {
      cy.get(this.weblocators.structireType , { timeout: 20000 }).should('contain.text', structureType);
    });

    }

    validateRoofAge(){

    cy.get('@roofAge').then(roofAge => {

  cy.get(this.weblocators.roofAge, { timeout: 20000 })
    .invoke('text')
    .then(text => {

      // "Roof Age: 3 years" → 3
      const actualAge = parseInt(text.replace(/\D/g, ''), 10);

      expect(actualAge).to.eq(Number(roofAge));
    });

});


    }

    validateFelt(){

           cy.get('@structureType').then( structureType => {
      cy.get(this.weblocators.structireType , { timeout: 20000 }).should('contain.text', structureType);
    });


    }

    validateDripEdge(){


    }

    validateName(){


    }

    validateLanguage(){


    }

    validateRoofPitch(){


    }

    validateLayer(){


    }

    validateIceWaterShield(){


    }

    validateEmail(){



    }

    validateCurrancy(){


    }




}

export default viewReport;
