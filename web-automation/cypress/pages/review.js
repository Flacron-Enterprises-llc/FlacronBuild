class review{
    
    //Locators

    weblocators={

        //step 5   
       reviewTitle: ':nth-child(3) > div > .text-lg',
       dateEstimate:':nth-child(1) > .flex.text-sm > .text-neutral-500',
    locationEstimate: ':nth-child(1) > .flex.text-sm > .flex',
    role: ':nth-child(1) > .flex.text-sm > .text-neutral-700',
       step6: '.text-neutral-500',
       processIcon: '.fixed > .bg-white',
       comparePage: 'div[class="flex-1 flex justify-center mr-20"] button:nth-child(2)',
       myEstimatesPage: '.hidden > :nth-child(3)',
       projectSavedMsg: '.grid > .font-semibold',
       error: '.opacity-90',
       pName: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4.text-sm > div:nth-child(1)',
       roleVarify: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4.text-sm > div:nth-child(2)',
      
       projectType: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4.text-sm > div:nth-child(3)',
       location: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4.text-sm > div:nth-child(4)',
       structureType: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4.text-sm > div:nth-child(5)',
       roofPitch: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4.text-sm > div:nth-child(6)',
       roofAge: 'div.grid.grid-cols-1.md\\:grid-cols-2.gap-4.text-sm > div:nth-child(7)',
   
       UploadedFile: '.space-y-8 > .space-y-6 > :nth-child(3)',
       
       materialLayers: '.grid > :nth-child(8)',
       generateEstimateButton: '.justify-between > .flex > .inline-flex',
       preButton: 'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"]',
       //optional upload
       confirmationMsg: '.opacity-90',
       
        
    }


  //Methords

  validateTitle(){

    cy.get(this.weblocators.reviewTitle).should('contain','Review')
    

  }

  verifySucessMessage() {
        cy.get(this.weblocators.confirmationMsg).should('have.text', 'Your estimate and PDF report are ready.');
    }

  validatedProjectGenerated(){



cy.get(this.weblocators.processIcon).should('be.visible')


//cy.get(this.weblocators.myEstimatesPage).should('be.visible')

  }


  validateProjectOnMyEstimatesPage(){

cy.wait(500)
     cy.get(this.weblocators.myEstimatesPage).click()


   cy.get('@savedProjectName').then(projectName=> {
    cy.log('projectName')
     
    cy.wait(500)
         cy.contains(projectName).should('be.visible').scrollIntoView()
         
    })     //  cy.contains(currentDate).should('be.visible');

    // 1. Create the date in "DD MMM YYYY" format
const now = new Date();
const day = now.getDate(); // 20
const month = now.toLocaleString('en-US', { month: 'short' }); // Jan
const year = now.getFullYear(); // 2026

// 2. Combine them to match "20 Jan 2026"
const formattedDate = `${day} ${month} ${year}`;

// 3. Use it in your test
cy.contains(formattedDate).should('be.visible').as('date');




/*
  cy.get('@city').then((city) => {
    cy.get('@country').then((country) => {
      const location = `${city}, ${country}`;

      cy.get(this.weblocators.location, { timeout: 20000 })
        .should('contain.text', location);
    });
  });
  */


cy.get('@mrole').then(mr => {
    // 1. Format the role for comparison
    let roleToCompare = mr.toLowerCase();
    if (roleToCompare === "insurance adjuster") {
        roleToCompare = "insurance-adjuster";
    }

    // 2. Find the container and verify the text exists inside it
    // We use 'be.visible' to ensure the page has finished loading from Firestore
    cy.contains('div', roleToCompare, { matchCase: false })
      .should('be.visible');
      
    cy.log('Successfully verified role:', roleToCompare);
});                           

  }



  
  validateProjectOnComparePage(){

         cy.get(this.weblocators.comparePage).click()


          cy.contains('@projectName').should('be.visible').scrollIntoView()
          const currentDate = new Date().toLocaleDateString();
   
           cy.contains(currentDate).should('be.visible');

  }
  validateStage(){

    cy.get(this.weblocators.step6).should('contain','Step 6 / 6')
    

  }
  
  varifyProjectName() {

  cy.get('@savedProjectName').then((projectName) => {

    cy.get(this.weblocators.pName, { timeout: 20000 })
      .invoke('text')
      .then((actualText) => {

        if (!actualText.includes(projectName)) {
          throw new Error(
            `Project name verification FAILED.Unable to create project
Expected project name: "${projectName}"
Actual text found: "${actualText}"`
          );
        }

        cy.log(`Project name verified successfully: ${projectName}`);

      });
  });
}


 varifyProjectName2() {

  cy.get('@savedProjectName2').then((projectName) => {

    cy.get(this.weblocators.pName, { timeout: 20000 })
      .invoke('text')
      .then((actualText) => {

        if (!actualText.includes(projectName)) {
          throw new Error(
            `Project name verification FAILED.Unable to create project
Expected project name: "${projectName}"
Actual text found: "${actualText}"`
          );
        }

        cy.log(`Project name verified successfully: ${projectName}`);

      });
  });
}

  varifyRole() {

  cy.get('@mrole').then(mr => {
    // 1. Create a variable to hold the modified name
    let roleToCompare = mr;

    // 2. If it matches "insurance adjuster", replace space with a hyphen
    if (mr.toLowerCase() === "insurance adjuster") {
      roleToCompare = mr.toLowerCase().replace(' ', '-'); // Result: "insurance-adjuster"
    }

    // 3. Perform the assertion using the modified string
    cy.get(this.weblocators.roleVarify)
      .invoke('text')
      .should(text => {
        expect(text.toLowerCase()).to.contain(roleToCompare.toLowerCase());
      });
  });
}


varifyProjectType() {
    cy.get('@selectedProjectType').then(expectedCategory => {
        // expectedCategory is now a clean, lowercase string, e.g., "commercial"

        cy.get(this.weblocators.projectType, { timeout: 20000 })
            .invoke('text')
            .then(actualText => {

                // Clean the Actual Value: Remove "Project Type:" and surrounding space
                const actualCategory = actualText
                    .replace('Project Type:', '')
                    .trim()
                    .toLowerCase(); 
                
                // actualCategory is now a clean, lowercase string, e.g., "commercial"

                // Comparison: Now they should match perfectly
                expect(actualCategory).to.equal(expectedCategory);
                
                // You can also use .contain if you're worried about subtle differences
                // expect(actualCategory).to.contain(expectedCategory);
            });
    });  
}  
  

 
 verifyLocation() {
  cy.get('@city').then((city) => {
    cy.get('@country').then((country) => {
      const location = `${city}, ${country}`;

      cy.get(this.weblocators.location, { timeout: 20000 })
        .should('contain.text', location);
    });
  });
}

 
 verifyLocation2() {
  cy.get('@city1').then((city) => {
    cy.get('@country1').then((country) => {
      const location = `${city}, ${country}`;

      cy.get(this.weblocators.location, { timeout: 20000 })
        .should('contain.text', location);
    });
  });
}



     varifyStructureType(){
 
   cy.get('@structureType').then( structureType=> {
      cy.get(this.weblocators.structureType , { timeout: 20000 }).should('contain.text', structureType);
    });
  
    
  }

  
 varifyRoofPitch(){
 
   cy.get('@roofPitch').then( roofPitch=> {
      cy.get(this.weblocators.roofPitch , { timeout: 20000 }).should('contain.text', roofPitch);
    });
  
    
  }


  
 varifyRoofAge(){


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

  
 varifyMaterialLayer1(){
 
      cy.get(this.weblocators.materialLayers , { timeout: 20000 }).should('contain.text', 'Material Layers: 1 layers');
    
  
    
  }

   varifyMaterialLayer2(){
 
 
      cy.get(this.weblocators.materialLayers , { timeout: 20000 }).should('contain.text', 'Material Layers: 2 layers');
    
  
    
  }
  varifyUploadedFile1(){
 
         cy.get(this.weblocators.UploadedFile, { timeout: 20000 }).should('contain.text', 'Uploaded Files: 1 file(s)');
    
  
    
  }

   varifyUploadedFile2(){
 
   
      cy.get(this.weblocators.UploadedFile , { timeout: 20000 }).should('contain.text', 'Uploaded Files: 2 file(s)');
    }
  
    
  


  clickGenerateEstimateButton(){

    cy.get(this.weblocators.generateEstimateButton).click()
    
   
    
  }

  clickPreButton(){

    cy.get(this.weblocators.preButton).click()
    cy.get(this.weblocators.step6).should('contain','Step 5 / 6')
  }
  
}

export default review;