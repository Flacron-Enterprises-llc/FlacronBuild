
import {faker} from '@faker-js/faker'  //faker for fack data for testing

class insurance {
    
    //Locators
    
    weblocators={

      title: '.text-lg.font-semibold.text-neutral-800',
        stage5: ':nth-child(3) > .text-neutral-500',
        roleTitle: '.text-lg.font-medium.text-neutral-800',
  

        // Text inputs
companyName: '[name="insuranceAdjusterInfo.companyName"]',
 adjusterId:  '[name="insuranceAdjusterInfo.adjusterId"]',
 jurisdiction:  '[name="insuranceAdjusterInfo.jurisdiction"]',

// Claim Info
 claimNumber:  '[name="claimNumber"]',
 policyHolder:  '[name="policyholderName"]',
 adjusterName: '[name="adjusterName"]',
 adjusterContact:  '[name="adjusterContact"]',

// Date
 dateOfLoss:  '[name="dateOfLoss"]',

// Buttons
 nextBtn: 'button:contains("Next")',
 previousBtn: 'button:contains("Previous")',


// Claim Types
 claimTypeCheckboxes: 'input[id^="claim-"]',

// Covered / Non-Covered / Maintenance
 coveredItems: 'input[id^="covered-"]',
 nonCoveredItems: 'input[id^="excluded-"]',
 maintenanceItems: 'input[id^="maintenance-"]',

 damageCauseDropdown: 'button[role="combobox"]:has(span:contains("Select damage cause"))',
 languageDropdown: '#\\:r4c\\:-form-item',
 currencyDropdown: '#\\:r4e\\:-form-item',

// Dropdown options (common)
 dropdownOptions: '[role="option"], select option'

   }


   setDateOfLoss = (type = 'past') => {
  const date = new Date()

  if (type === 'past') date.setDate(date.getDate() - 10)
  if (type === 'future') date.setDate(date.getDate() + 10)

  const formatted = date.toISOString().split('T')[0]
  cy.get('input[name="dateOfLoss"]').type(formatted)
}
selectRandomDropdown(buttonText, aliasName = null) {
  cy.contains('button', buttonText)
    .click({ force: true })
    .focus()
    .then($btn => {

      cy.wrap($btn).type('{downarrow}', { force: true })
      cy.wait(200)

      const steps = Cypress._.random(1, 4)
      for (let i = 0; i < steps; i++) {
        cy.wrap($btn).type('{downarrow}', { force: true })
      }

      cy.wrap($btn).type('{enter}', { force: true })

      // Save selected value
      if (aliasName) {
        cy.wrap($btn)
          .find('span')
          .invoke('text')
          .then(text => cy.wrap(text.trim()).as(aliasName))
      }
    })
}

selectprimaryDamageCauseDropdown() {
 
      // select and store selected value
cy.selectRandom(this.weblocators.damageCauseDropdown).as('primaryDamageCause').then(selected => {
   cy.log("Selected value primaryDamageCause:", selected);

    })


}

selectLanguageDropdown() {
 
 
       //select and store selected value
  cy.selectRandom(this.weblocators.languageDropdown).as('language').then(selected => {
    cy.log("Selected value Language:", selected);
});

}
   
selectCurrancyDropdown() {
 
       //select and store selected value
  cy.selectRandom(this.weblocators.currencyDropdown).as('currancy').then(selected => {
    cy.log("Selected value currancy:", selected);
});

}

   fillInsuranceStage5() {

    const companyName = faker.company.buzzAdjective()
    const adjusterId = faker.string.nanoid({ min: 5, max: 8 })
    const jurisdiction = faker.location.country()
    const claimNumber = faker.string.numeric(4)
    const policyHolder = faker.person.firstName()
    const adjusterName = faker.person.firstName()
    const adjusterContact = faker.phone.number()
    

  cy.get(this.weblocators.companyName).type(companyName)
  cy.wrap(companyName).as('companyName');


  cy.get(this.weblocators.adjusterId).type( adjusterId)
    cy.wrap(adjusterId).as('adjusterId');

  cy.get(this.weblocators.jurisdiction).type(jurisdiction)
   cy.wrap(jurisdiction).as('jurisdiction');

  // Claim Types
  this.selectRandomCheckboxes(this.weblocators.claimTypeCheckboxes, 3)
  
  // Claim Info
  cy.get(this.weblocators.claimNumber).type(claimNumber)
  cy.wrap(claimNumber).as('claimNumber');

  cy.get(this.weblocators.policyHolder).type(policyHolder)
  cy.wrap(policyHolder).as('policyHolder');

  cy.get(this.weblocators.adjusterName).type(adjusterName)
  cy.wrap(adjusterName).as('adjusterName');

  cy.get(this.weblocators.adjusterContact).type(adjusterContact)
  cy.wrap(adjusterContact).as('adjusterContact');

  // Date
  this.setDateOfLoss('past')

  // Dropdowns
  this.selectprimaryDamageCauseDropdown()

 

  // Coverage
  this.selectRandomCheckboxes(this.weblocators.coveredItems, 3)
 this.selectRandomCheckboxes(this.weblocators.nonCoveredItems, 2)
 this.selectRandomCheckboxes(this.weblocators.maintenanceItems, 2)
 //   this.selectLanguageDropdown()
 // this.selectCurrancyDropdown()
}



   fillInsuranceStage5WithFutureLossDate() {


    const companyName = faker.company.buzzAdjective()
    const adjusterId = faker.string.nanoid({ min: 5, max: 8 })
    const jurisdiction = faker.location.country()
    const claimNumber = faker.string.numeric(4)
    const policyHolder = faker.person.firstName()
    const adjusterName = faker.person.firstName()
    const adjusterContact = faker.phone.number()
    

  cy.get(this.weblocators.companyName).type(companyName)
  cy.wrap(companyName).as('companyName');


  cy.get(this.weblocators.adjusterId).type( adjusterId)
    cy.wrap(adjusterId).as('adjusterId');

  cy.get(this.weblocators.jurisdiction).type(jurisdiction)
   cy.wrap(jurisdiction).as('jurisdiction');

  // Claim Types
  this.selectRandomCheckboxes(this.weblocators.claimTypeCheckboxes, 3)
  
  // Claim Info
  cy.get(this.weblocators.claimNumber).type(claimNumber)
  cy.wrap(claimNumber).as('claimNumber');

  cy.get(this.weblocators.policyHolder).type(policyHolder)
  cy.wrap(policyHolder).as('policyHolder');

  cy.get(this.weblocators.adjusterName).type(adjusterName)
  cy.wrap(adjusterName).as('adjusterName');

  cy.get(this.weblocators.adjusterContact).type(adjusterContact)
  cy.wrap(adjusterContact).as('adjusterContact');

  // Date
  this.setDateOfLoss('future')

  // Dropdowns
  this.selectprimaryDamageCauseDropdown()
 // this.selectLanguageDropdown()
 // this.selectCurrancyDropdown()
 

  // Coverage
  this.selectRandomCheckboxes(this.weblocators.coveredItems, 3)
 this.selectRandomCheckboxes(this.weblocators.nonCoveredItems, 2)
 this.selectRandomCheckboxes(this.weblocators.maintenanceItems, 2)
}





   fillInsuranceStage5WithInvalidData() {


    const companyName = faker.company.buzzAdjective()
    const adjusterId = faker.string.nanoid({ min: 5, max: 8 })
    const jurisdiction = faker.string.numeric(4)//invalid data
    const claimNumber = faker.person.firstName() //invalid data
    const policyHolder = faker.person.firstName() //invalid data
    const adjusterName =  faker.string.numeric(4) //invalid data
    const adjusterContact =  faker.person.firstName() //invalid data
    

  cy.get(this.weblocators.companyName).type(companyName)
  cy.wrap(companyName).as('companyName');


  cy.get(this.weblocators.adjusterId).type( adjusterId)
    cy.wrap(adjusterId).as('adjusterId');

  cy.get(this.weblocators.jurisdiction).type(jurisdiction)
   cy.wrap(jurisdiction).as('jurisdiction');

  // Claim Types
  this.selectRandomCheckboxes(this.weblocators.claimTypeCheckboxes, 3)
  
  // Claim Info
  cy.get(this.weblocators.claimNumber).type(claimNumber)
  cy.wrap(claimNumber).as('claimNumber');

  cy.get(this.weblocators.policyHolder).type(policyHolder)
  cy.wrap(policyHolder).as('policyHolder');

  cy.get(this.weblocators.adjusterName).type(adjusterName)
  cy.wrap(adjusterName).as('adjusterName');

  cy.get(this.weblocators.adjusterContact).type(adjusterContact)
  cy.wrap(adjusterContact).as('adjusterContact');

  // Date
  this.setDateOfLoss('future')

  // Dropdowns
  this.selectprimaryDamageCauseDropdown()
//  this.selectLanguageDropdown()
//  this.selectCurrancyDropdown()
 

  // Coverage
  this.selectRandomCheckboxes(this.weblocators.coveredItems, 3)
 this.selectRandomCheckboxes(this.weblocators.nonCoveredItems, 2)
 this.selectRandomCheckboxes(this.weblocators.maintenanceItems, 2)
}

selectRandomCheckboxes(selector, count = 2, aliasName = null) {
  cy.get(selector).then($items => {
    const random = Cypress._.sampleSize($items.toArray(), count)

    const selectedValues = []

    random.forEach(el => {
      cy.wrap(el)
        .check({ force: true })
        .invoke('val')
        .then(val => selectedValues.push(val))
    })

    if (aliasName) {
      cy.wrap(selectedValues).as(aliasName)
    }
  })
}



selectRandomCheckboxes = (selector, count = 2) => {
  cy.get(selector).then($items => {
    const random = Cypress._.sampleSize($items.toArray(), count)
    random.forEach(el => cy.wrap(el).check({ force: true }))
  })
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

  
  clickNextButton(){

    cy.get(this.weblocators.nextBtn).click()
    

  }




}



export default insurance