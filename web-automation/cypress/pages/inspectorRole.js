
import {faker} from '@faker-js/faker'  //faker for fack data for testing

class inspectorRole{

    
    //Locators
    

    weblocators={

        jobTypeDropDown: '#\\:r3u\\:-form-item',
        title: '.text-lg.font-semibold.text-neutral-800',
        stage5: ':nth-child(3) > .text-neutral-500',
        roleTitle: '.text-lg.font-medium.text-neutral-800',
         inspectorName: 'input[name="inspectorInfo.name"]',
         licenseNum: 'input[name="inspectorInfo.license"]',
         datePicker: '#\\:r40\\:-form-item',
         watherDropdown: 'button[role="combobox"]:has(span:contains("Select weather conditions"))',

         AddSlopeButton: '.space-y-4 > .inline-flex',
        slopeIdentifier: 'input[name="slopeDamage.0.slope"]',
        slopeIdentifier2: '#\\:r50\\:-form-item',
        damageTypeDropdown: 'button[role="combobox"]:has(span:contains("Wind Damage"))',
        damageSeverity: 'button[role="combobox"]:has(span:contains("Minor"))',
        damageDescription: 'input[name="slopeDamage.0.description"]',
        removeSlopeButton: '.p-6 > .inline-flex',
         ownerNote: 'input[name="ownerNotes"]',
         languageDropdown: '#\\:r4d\\:-form-item',
         currencyDropdown: '#\\:r4f\\:-form-item',
         nextButton: '.pt-6 > .flex > .inline-flex',
         preButton: '.pt-6 > .hover\:bg-accent'
    
    }

    
  //Methords
  
selectWatherDropdown() {
 
       //select and store selected value
  cy.selectRandom(this.weblocators.watherDropdown).as('wather').then(selected => {
    cy.log("Selected value Job Type:", selected);
   // toLowerCase
});

}


selectLanguageDropdown() {
 
       //select and store selected value
    //   cy.contains('button[role="combobox"]', 'Select language').click();

  cy.selectRandom(this.weblocators.languageDropdown).as('language').then(selected => {
    cy.log("Selected value Language:", selected);
});

}

selectCurrancyDropdown() {
 
       //select and store selected value
  cy.selectRandom(this.weblocators.currencyDropdown).as('currancy').then(selected => {
    cy.log("Selected value currency:", selected);
});

}

clickAddSlope() {
  cy.contains('button', 'Add Slope Damage')
    .should('be.visible')
    .first()
    .click();
}




addSingleSlope(SName) {
 // cy.get(this.weblocators.AddSlopeButton).click({ force: true },{ multiple: true });

this.clickAddSlope()

  cy.get(this.weblocators.slopeIdentifier)
    .should('be.visible')
    .type(SName);

   cy.selectRandom(this.weblocators.damageTypeDropdown).as('damageType').then(selected => {
    cy.log("Selected value Damage Type:", selected);

  cy.selectRandom(this.weblocators.damageSeverity).as('damageSeverity').then(selected => {
    cy.log("Selected value Damage Severity:", selected);


  cy.get(this.weblocators.damageDescription)
    .type('Visible wind damage on slope');
})
   })
}


removeSlope() {
  cy.get(this.weblocators.removeSlopeButton)
    .should('be.visible')
    .click();
}


   
enterInspector(IName){
      cy.get(this.weblocators.inspectorName).type(IName)

}

enterLicenseNum(LicenseNum){
      cy.get(this.weblocators.licenseNum).type(LicenseNum);

}



enterOwnerNote(){
      cy.get(this.weblocators.ownerNote).type("this is testing");

}


selectDate(){
      /*
  //cy.get(this.weblocators.datePicker).click();
  cy.contains('Pick a date').click()
  cy.get('[role="gridcell"]').first().click();
  */
 // 1. Open the calendar
  cy.contains('Pick a date').click();

  // 2. Wait for the calendar grid to be visible
  cy.get('[role="grid"]', { timeout: 5000 }).should('be.visible');

  // 3. Find all available days that are NOT:
  // - "outside" (days from previous/next month)
  // - "muted" (disabled days)
  // - "selected" (today)
  // We filter to ensure we only click a day that is active
  cy.get('[role="gridcell"]')
    .not('[aria-disabled="true"]') // Skip disabled
    .not('.rdp-day_outside')       // Skip days from other months (specific to React Day Picker)
    .then(($days) => {
      // Pick a day towards the end of the list to ensure it's in the future
      const totalDays = $days.length;
      const futureIndex = Math.floor(totalDays / 2) + 1; // Pick a day in the second half of the month
      
      cy.wrap($days).eq(futureIndex).click();
    });

}

selectPastDateAndSave(daysAgo = 3) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  const day = date.getDate(); // for calendar click
  const formattedDate = date.toLocaleDateString('en-US');

  // Save date
  Cypress.env('selectedDate', formattedDate);

  // Open date picker
  cy.get(this.weblocators.datePicker).click();

  // Click past date (skip disabled dates)
  cy.get('[role="gridcell"]')
    .not('[aria-disabled="true"]')
    .contains(new RegExp(`^${day}$`))
    .click();
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

  //scanarios start for step 5 for Instpector with/without slope
  //scanario 1
  
  //  SCENARIO FUNCTION (THIS WAS THE ISSUE)
  scenarioWithoutSlope() {
    const inspectorName = faker.person.firstName();
    const licenseNumber = faker.number.binary(255);

    this.enterInspector(inspectorName);
    cy.wrap(inspectorName).as('inspectorName');

    this.enterLicenseNum(licenseNumber);
    cy.wrap(licenseNumber).as('licenseNum');

    this.selectDate();
    this.selectWatherDropdown();
    this.enterOwnerNote();
  


  }
scenarioWithSingleSlope(SName) {

     const inspectorName = faker.person.firstName();
    const licenseNumber = faker.number.binary(255);

    this.enterInspector(inspectorName);
    cy.wrap(inspectorName).as('inspectorName');

    this.enterLicenseNum(licenseNumber);
    cy.wrap(licenseNumber).as('licenseNum');
  this.selectDate()
  this.selectWatherDropdown()
  

  this.addSingleSlope(SName);
this.enterOwnerNote()

 
}

//scanario 3 add 5 slope

scenarioWithMultipleSlopes() {
   
     const inspectorName = faker.person.firstName();
    const licenseNumber = faker.number.binary(255);
     const slope1 = faker.person.firstName();
    const slope2 = faker.person.firstName();
     const slope3 = faker.person.firstName();
 

    this.enterInspector(inspectorName);
    cy.wrap(inspectorName).as('inspectorName');

    this.enterLicenseNum(licenseNumber);
    cy.wrap(licenseNumber).as('licenseNum');
  this.selectDate()
  this.selectWatherDropdown()
  
  this.addSingleSlope(slope1); //call reused function for adding slope
   cy.wrap(slope1).as('slope1');
   this.addSingleSlope(slope2);
    cy.wrap(slope2).as('slope2');
 

 this.enterOwnerNote()


}


//scanario 4, adding slope and remove it

scenarioAddAndRemoveSlope() {
   
     const inspectorName = faker.person.firstName();
    const licenseNumber = faker.number.binary(255);
     const slope = faker.person.firstName();
    
     cy.log("entring data in inpector name")

    this.enterInspector(inspectorName);
    cy.wrap(inspectorName).as('inspectorName');

      cy.log("entring license number")
    
    this.enterLicenseNum(licenseNumber);
    cy.wrap(licenseNumber).as('licenseNum');

      cy.log("selecting date")
  this.selectDate()

    cy.log("selecting wather")
  this.selectWatherDropdown()


  cy.log("adding slope")
  this.addSingleSlope(slope);

    cy.log("removing slope")
    this.removeSlope();
    cy.get(this.weblocators.slopeIdentifier2)
    .should('not.exist');

      cy.log("entring note")
this.enterOwnerNote()



}


//scanario 5, adding slope but not fill details

scenarioIncompleteSlope() {
    const inspectorName = faker.person.firstName();
    const licenseNumber = faker.number.binary(255);
     const slope = faker.person.firstName();
    
     cy.log("entring data in inspector name")

    this.enterInspector(inspectorName);
    cy.wrap(inspectorName).as('inspectorName');

      cy.log("entring license number")
    
    this.enterLicenseNum(licenseNumber);
    cy.wrap(licenseNumber).as('licenseNum');

      cy.log("selecting date")
  this.selectDate()

    cy.log("selecting wather")
  this.selectWatherDropdown()

  cy.get(this.weblocators.AddSlopeButton).click();

  this.clickNextButton();

  cy.contains('Please complete slope details')
    .should('be.visible');
}



//scanario 6, adding slope with past date

pickPastDate() {
    const inspectorName = faker.person.firstName();
    const licenseNumber = faker.number.binary(255);
     const slope = faker.person.firstName();
    
     cy.log("entring data in inspector name")

    this.enterInspector(inspectorName);
    cy.wrap(inspectorName).as('inspectorName');

      cy.log("entring license number")
    
    this.enterLicenseNum(licenseNumber);
    cy.wrap(licenseNumber).as('licenseNum');

      cy.log("selecting past date")
  this.selectPastDateAndSave()

  
  cy.contains('Please seelct correct date')
    .should('be.visible');

    cy.log("selecting wather")
  this.selectWatherDropdown()


}

}

export default inspectorRole
