class contractorRole{

    
    //Locators
    

    weblocators={

        jobTypeDropDown: 'button[role="combobox"]:has(span:contains("Select job type"))',
        title: '.text-lg.font-semibold.text-neutral-800',
        stage5: ':nth-child(3) > .text-neutral-500',
        roleDropdown: '#\\:rf\\:-form-item',
         materialPreferenceDropdown: 'button[role="combobox"]:has(span:contains("Select material preference"))',
         workerCountDropdown: 'button[role="combobox"]:has(span:contains("Select worker count"))',
         steepAssistCheckbox: ' [id=":r4q:-form-item"]',
         shinglesRoofingMaterialCheckbox: '[id="lineitem-Shingles/Roofing Material"]',
         UnderlaymentFeltCheckbox: '[id="lineitem-Underlayment & Felt"]',
         iceWaterShieldCheckbox: '[id="lineitem-Ice & Water Shield"]',
         dripEdgeTrimCheckbox: '[id="lineitem-Drip Edge & Trim"]',
         guttersDownspoutsCheckbox: '[id="lineitem-Gutters & Downspouts"]',
         flashingCheckbox: '[id="lineitem-Flashing (All Types)"]',
         ridgeVentsVentilationCheckbox: '[id="lineitem-Ridge Vents & Ventilation"]',
         soffitFasciaCheckbox: '[id="lineitem-Soffit & Fascia"]',
         pipeBootsPenetrationsCheckbox: '[id="lineitem-Pipe Boots & Penetrations"]',
         chimneyWorkFlashingCheckbox: '[id="lineitem-Chimney Work & Flashing"]',
         skylightInstallationCheckbox: '[id="lineitem-Skylight Installation"]',
         atticInsulationCheckbox: '[id="lineitem-Attic Insulation"]',
         deckRepairReplacementCheckbox: '[id="lineitem-Deck Repair/Replacement"]',
         structuralReinforcementCheckbox: '[id="lineitem-Structural Reinforcement"]',
         emergencyTarpingCheckbox: '[id="lineitem-Emergency Tarping"]',
         debrisRemovalCheckbox: '[id="lineitem-Debris Removal"]',
         permitInspectionFeesCheckbox: '[id="lineitem-Permit & Inspection Fees"]',
         materialDeliveryCheckbox: '#lineitem-Material\\ Delivery',
        // localPermitCheckbox: '#\\:r46\\:-form-item',
         languageDropdown: '#\\:r47\\:-form-item',
         currencyDropdown: '#\\:r49\\:-form-item',
         nextButton: 'body > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > form:nth-child(2) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)',
         preButton: 'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"]'
    
    }

    
  //Methords
selectRandomCheckboxes() {
  const checkboxes = [
   // { locator: this.weblocators.steepAssistCheckbox, name: "steep Assist" },
    { locator: this.weblocators.shinglesRoofingMaterialCheckbox, name: "shingles Roofing Material" },
    { locator: this.weblocators.UnderlaymentFeltCheckbox, name: "Under layment Felt" },
    { locator: this.weblocators.iceWaterShieldCheckbox, name: "ice Water Shield "},
    { locator: this.weblocators.dripEdgeTrimCheckbox, name: "dripEdge  Trim" },
    { locator: this.weblocators.guttersDownspoutsCheckbox, name: "gutters Down spouts" },
    { locator: this.weblocators.flashingCheckbox, name: "flashing" },
    { locator: this.weblocators.ridgeVentsVentilationCheckbox, name: "ridge Vents Ventilation" },
    { locator: this.weblocators.soffitFasciaCheckbox, name: "soffit Fascia " },
    { locator: this.weblocators.pipeBootsPenetrationsCheckbox, name: "pipe Boots Penetrations" },
    { locator: this.weblocators.chimneyWorkFlashingCheckbox, name: "chimney Work Flashing" },
    { locator: this.weblocators.skylightInstallationCheckbox, name: "skylight Installation" },
    { locator: this.weblocators.atticInsulationCheckbox, name: "attic Insulation" },
    { locator: this.weblocators.deckRepairReplacementCheckbox, name: "deckRepair Replacement" },
    { locator: this.weblocators.structuralReinforcementCheckbox, name: "structural Reinforcement" },
    { locator: this.weblocators.emergencyTarpingCheckbox, name: "emergency Tarping" },
    { locator: this.weblocators.debrisRemovalCheckbox, name: "debris Removal" },
    { locator: this.weblocators.permitInspectionFeesCheckbox, name: "permit Inspection Fees" },
    { locator: this.weblocators.materialDeliveryCheckbox, name: "material Delivery" },
  //  { locator: this.weblocators.localPermitCheckbox, name: "local Permit" },
       
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



  
  validateTitleForCon(){

    cy.get(this.weblocators.title).should('contain','Contractor-Specific Information')
    

  }
   selectCheckBoxes(){
   
  // call function
  selectRandomCheckboxes();

  }
  
  
  clickNextButton(){

    cy.get(this.weblocators.nextButton).click()
    
    
  }

  clickPreButton(){

   // cy.get(this.weblocators.preButton).click({ force: true})
   cy.contains('Previous').click()
    cy.get(this.weblocators.stage5).should('contain','Step 4 / 6')
    

  }

  
  validateTitle(){

    cy.get(this.weblocators.roleTitle).should('contain','Role Specific')
    

  }

  validateStage(){

    cy.get(this.weblocators.stage5).should('contain','Step 5 / 6')
    

  }

  
     selectRandomDropdowns(){

    //select and store selected value
  cy.selectRandom(this.weblocators.jobTypeDropDown).as('jobType').then(selected => {
    cy.log("Selected value Job Type:", selected);
});
  cy.selectRandom(this.weblocators.materialPreferenceDropdown).as('materialPreference').then(selected => {
    cy.log("Selected value for material Preference:", selected);
});
  cy.selectRandom(this.weblocators.workerCountDropdown).as('workerCount').then(selected => {
    cy.log("Selected value: for worker Count:", selected);
});

   
    }


}

export default contractorRole;
