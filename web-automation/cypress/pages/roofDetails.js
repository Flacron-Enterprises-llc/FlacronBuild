class roofDetails{

    //Locators

    weblocators={

     //step 3
       roofDetailTitle: '.text-lg.font-medium.text-neutral-800',
       step3: '.text-sm.text-neutral-500',
       structutreTypeDropdown: '.grid > :nth-child(1) > .flex',
       roofPitchDropdown: '.grid > :nth-child(2) > .flex',
       roofAgeBox: '[name="roofAge"]',
       roofAgeBoxError: '[id=":r4o:-form-item-message"]',
       structutreTypeDropdownError: '[id=":r4k:-form-item-message"]',
       roofPitchDropdownError: '[id=":r4m:-form-item-message"]',
       previpusButton: 'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"]',
       nextButton: 'body > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > form:nth-child(2) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)',
       
    }

  //Methords

  validateTitle(){

    cy.get(this.weblocators.roofDetailTitle).should('contain','Roof Details')
    

  }

  validateStage(){

    cy.get(this.weblocators.step3).should('contain','Step 3 / 6')
    

  }

  validateErrorOnEmptyStructureType(){

    cy.get(this.weblocators.nextButton).click()
    cy.wait(200)
    cy.get(this.weblocators.structutreTypeDropdownError).should('contain','Structure type is required')
    
  }

    validateErrorOnEmptyroofPitch(){

    cy.get(this.weblocators.nextButton).click()
    cy.wait(200)
    cy.get(this.weblocators.roofPitchDropdownError).should('contain','Roof pitch is required')
    
  }

   validateErrorOnEmptyroofAgeBox(){

    cy.get(this.weblocators.nextButton).click()
    cy.wait(200)
    cy.get(this.weblocators.roofAgeBoxError).should('contain','Roof age is required')
    
  }

  selectRandomStructureType(){

     //select and store selected value
       cy.selectRandom(this.weblocators.structutreTypeDropdown)
  .as('structureType').then(selected => {
    cy.log("Selected value for structure type:", selected);
});

  }
  
     selectRandomStructureType2(){

     //select and store selected value
       cy.selectRandom(this.weblocators.structutreTypeDropdown)
  .as('structureType2').then(selected => {
    cy.log("Selected value for structure type:", selected);
});

   }
      selectRandomRoofPitch(){

 
          //select and store selected value
       cy.selectRandom(this.weblocators.roofPitchDropdown).as('roofPitch').then(selected => {
    cy.log("Selected value for roof pitch:", selected);
});

    }

          selectRandomRoofPitch2(){

 
          //select and store selected value
       cy.selectRandom(this.weblocators.roofPitchDropdown).as('roofPitch2').then(selected => {
    cy.log("Selected value for roof pitch:", selected);
});

    }

    enterRoofAge(Age){

 
    //cy.get(this.weblocators.roofAgeBox).type(Age).as('roofAge')

    cy.wrap(Age).as('roofAge'); // Saves the string value 'Age'
    cy.get(this.weblocators.roofAgeBox).type(Age);
    }


    
    enterRoofAge2(Age){

 
    //cy.get(this.weblocators.roofAgeBox).type(Age).as('roofAge')

    cy.wrap(Age).as('roofAge2'); // Saves the string value 'Age'
    cy.get(this.weblocators.roofAgeBox).type(Age);
    }
    

    enterInvaidRoofAge(){

 
    cy.get(this.weblocators.roofAgeBox).type("Age")
     cy.get(this.weblocators.roofAgeBox).should('have.value', '');
    
    
    }


    


    ClickNextButton(){

 
    //cy.get(this.weblocators.nextButton).click()
  cy.smartNext(this.weblocators.nextButton) 
  
  }
  
    ClickPreButton(){

 
    cy.get(this.weblocators.previpusButton).click()
    cy.get(this.weblocators.step3).should('contain','Step 2 / 6')
    }
  
}

export default roofDetails;