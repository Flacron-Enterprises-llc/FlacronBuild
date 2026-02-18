class materials{
  //step 4
    
    //Locators

    weblocators={

//step 4
 
       materialsTitle: '.text-lg.font-medium.text-neutral-800',
       materialError: '#\\:r2f\\:-form-item-message',
       step4: '.text-sm.text-neutral-500',
       materialLayerDropdown: 'div[class="space-y-2"] div[class="space-y-2"] button[role="combobox"]',
      fletTypeDropdown: '#\\:r2h\\:-form-item',
       iceWaterCheckBox: '#\\:r2j\\:-form-item',
       dripEdgeCheckBox: '#\\:r2k\\:-form-item',
       materialLayedCross: '.space-y-1 > .flex > .inline-flex',
       gutterApronCheckbox: '#\\:r2l\\:-form-item',
       deleteLayer1: '.space-y-1 > :nth-child(1) > .inline-flex',
       deleteLayer2: '.space-y-1 > :nth-child(1) > .inline-flex',
       deleteLayer3: ':nth-child(3) > .inline-flex',
       preButton: '.hover\:bg-accent',
       //optional upload
       nextButton: '.pt-6 > .flex > .inline-flex',
       
    }


  //Methords
selectRandomCheckboxes() {
  const checkboxes = [
    { locator: this.weblocators.iceWaterCheckBox, name: "Ice Water Shield" },
    { locator: this.weblocators.dripEdgeCheckBox, name: "Drip Edge" },
    { locator: this.weblocators.gutterApronCheckbox, name: "Gutter Apron" }
  ];

  // list length (1 to 3 random)
  const howMany = Math.floor(Math.random() * checkboxes.length) + 1;

  // shuffle array
  const shuffled = checkboxes.sort(() => 0.5 - Math.random());

  // pick randomly
  const selected = shuffled.slice(0, howMany);

  // click checkboxes
  selected.forEach(item => {
    cy.get(item.locator).check({ force: true });
  });

  // Save selected list to Cypress env / alias
  cy.wrap(selected).as('selectedOptions');

  return selected;
}

  validateTitle(){

    cy.get(this.weblocators.materialsTitle).should('contain','Materials')
    

  }
  validateStage(){

    cy.get(this.weblocators.step4).should('contain','Step 4 / 6')
    

  }

  validateEmptyMaterailError(){

    cy.contains('At least one material layer is required').should('be.visible')
   // cy.get(this.weblocators.materialError).should('contain','At least one material layer is required')
    

  }

  clickNextButton(){

    //cy.get(this.weblocators.nextButton).click()
    
    cy.smartNext(this.weblocators.nextButton) 
    

  }

  deleteAddedLayed(){

    cy.get(this.weblocators.deleteLayer1).click()
    
cy.wait(200)
    cy.get(this.weblocators.deleteLayer2).click()
    
cy.wait(200)
  //  cy.get(this.weblocators.deleteLayer3).click()

  }

  clickPreButton(){

   // cy.get(this.weblocators.preButton).click({ force: true})
   cy.contains('Previous').click()
    cy.get(this.weblocators.step4).should('contain','Step 3 / 6')
    

  }

  selectRandomMaterialSingle(){

    //select and store selected value
  cy.selectRandom(this.weblocators.materialLayerDropdown).as('layer').then(selected => {
    cy.log("Selected value for material :", selected);
});
   
    }

     selectRandomMaterialMultiple(){

    //select and store selected value
  cy.selectRandom(this.weblocators.materialLayerDropdown).as('layer1').then(selected => {
    cy.log("Selected value layer 1:", selected);
});
cy.wait(200)
  cy.selectRandom(this.weblocators.materialLayerDropdown).as('layer2').then(selected => {
    cy.log("Selected value for laye 2:", selected);
});
 
    }

  selectRandomFeltType(){

     cy.selectRandom(this.weblocators.fletTypeDropdown).as('feltType')


  }
selectRandomFeltTypeXpath() {
  // Use cy.xpath to find the element, then call your custom command
  cy.xpath(this.weblocators.fletTypeDropdown)
    .pipe(cy.selectRandom) // Use .pipe if selectRandom is a function
    .as('feltType');
}

   selectCheckBoxes(){
   
  // call function
  selectRandomCheckboxes();

  }

  
}

export default materials;