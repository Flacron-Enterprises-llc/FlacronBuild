class dashboardRoleProject{

  static productName; 


  //step 1
    
    //Locators

    weblocators={

        //step 1
       title :':nth-child(3) > div > .text-lg',
       step1: '.text-sm.text-neutral-500',
       crole: '#\\:rf\\:-form-item',
       roleDropdown: '#\\:rf\\:-form-item',
       role: '.p-3',
       roledropdown: '[data-top="935"]',
        step2: '.text-sm.text-neutral-500',
       errorProjectName: '#\\:ra\\:-form-item-message',
       errorProjectNameForCon: '#\\:re\\:-form-item-message',
       roleAndProject: '.text-lg.font-medium.text-neutral-800',
       previousButton: 'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"]',
       projectName: '#\\:re\\:-form-item',
       yourRole: '.p-3.border.rounded.bg-neutral-50.text-base.font-medium',
       projectType: '[role="option"]',
       combo: 'button[role="combobox"]',
     projectdropdown: '#\\:rh\\:-form-item',
       location: '.text-sm.font-semibold',
       nextButton: 'body > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > form:nth-child(2) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)',
       
    }


  //Methords

  enterProjectName(PName){

    cy.get(this.weblocators.projectName).type(PName)
      cy.wrap(PName).as('projectName');
    

  }
    validateYourRole(){

     cy.get(this.weblocators.crole)
  .invoke('text')
  .then(text => {
      const cleanRole = text.trim();
      cy.wrap(cleanRole).as('mrole'); //remove role:
  });

    
  }


   validateYourRoleForHomeowner(){

     cy.get(this.weblocators.role)
  .invoke('text')
  .then(text => {
      const cleanRole = text.trim();
      cy.wrap(cleanRole).as('mrole'); //remove role:
  });

    
  }

  

  validateRoleDropdown(){

    
     cy.get(this.weblocators.roledropdown)
  .invoke('text')
  .then(text => {
      const cleanRole = text.trim();
      cy.wrap(cleanRole).as('mrole'); //remove role:
  });
  }

  
  validatePreviousButton(){

    cy.get(this.weblocators.previousButton).should('be.visible').and('be.disabled')
    

  }

  varifyLocationPopup(){

    cy.wait(100)

    cy.get(this.weblocators.location).should('be.visible')
  }

  
    validateSteps(){

    cy.get(this.weblocators.step1).should('be.visible').and('contain','Step 1 / 6')
    

  }

     validateStep2(){

    cy.get(this.weblocators.step1).should('be.visible').and('contain','Step 2 / 6')
    

  }

  
    validateTitle(){

    cy.get(this.weblocators.title).should('be.visible').and('contain','Role & Project')
    

  }

  

selectProjectType() {
    cy.get(this.weblocators.combo).click({ force: true });

    cy.get(this.weblocators.projectType).then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        const selectedOptionText = $options[randomIndex].innerText.trim();

        //  FIX: Isolate the main category name before saving.
        // The main category is the text BEFORE the newline character (\n).
        const selectedCategory = selectedOptionText.split('\n')[0].trim();
        
        // Save the simplified value to Cypress alias
        cy.wrap(selectedCategory.toLowerCase()).as('selectedProjectType'); // Save as lowercase for easier comparison

        // Click the option
        cy.wrap($options[randomIndex]).click({ force: true });
    });
}
    clickNextButton(){

    cy.get(this.weblocators.nextButton).click({ multiple: true })
    

  }
  
  selectProjectTypeDropdown() {
    cy.get(this.weblocators.projectdropdown).click({ force: true });

    cy.get(this.weblocators.projectType).then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        const selectedOptionText = $options[randomIndex].innerText.trim();

        //  FIX: Isolate the main category name before saving.
        // The main category is the text BEFORE the newline character (\n).
        const selectedCategory = selectedOptionText.split('\n')[0].trim();
        
        // Save the simplified value to Cypress alias
        cy.wrap(selectedCategory.toLowerCase()).as('selectedProjectType'); // Save as lowercase for easier comparison

        // Click the option
        cy.wrap($options[randomIndex]).click({ force: true });
    });
}
    clickNextButton(){

    cy.get(this.weblocators.nextButton).click({ multiple: true })
    

  }
  
 changeRoleForContractor() {

  // Open dropdown (combobox button)
  cy.get(this.weblocators.roleDropdown)
    .should('be.visible')
    .click();

  // Wait for dropdown options (rendered in portal)
  cy.get(this.weblocators.roleDropdown, { timeout: 10000 })
    .should('be.visible');

   // 3. Select Inspector (robust selector)
  cy.get('[role="listbox"]')
    .find('[role="option"]')
    .contains(/^Contractor$/)
    .should('be.visible')
    .click();

  // Verify selection
  cy.get(this.weblocators.roleDropdown)
    .should('contain.text', 'Contractor');
}
  

  
 changeRoleForInspector() {

  // Open dropdown (combobox button)
  cy.get(this.weblocators.roleDropdown)
    .should('be.visible')
    .click();

  // Wait for dropdown options (rendered in portal)
  cy.get(this.weblocators.roleDropdown, { timeout: 10000 })
    .should('be.visible');

   // 3. Select Inspector (robust selector)
  cy.get('[role="listbox"]')
    .find('[role="option"]')
    .contains(/^Inspector$/)
    .should('be.visible')
    .click();

  // Verify selection
  cy.get(this.weblocators.roleDropdown)
    .should('contain.text', 'Inspector');
}

 
 changeRoleForHomeowner() {

  // Open dropdown (combobox button)
  cy.get(this.weblocators.roleDropdown)
    .should('be.visible')
    .click();

  // Wait for dropdown options (rendered in portal)
  cy.get(this.weblocators.roleDropdown, { timeout: 10000 })
    .should('be.visible');

   // 3. Select Inspector (robust selector)
  cy.get('[role="listbox"]')
    .find('[role="option"]')
    .contains(/^Homeowner$/)
    .should('be.visible')
    .click();

  // Verify selection
  cy.get(this.weblocators.roleDropdown)
    .should('contain.text', 'Homeowner');
}

 
 changeRoleForInsurance() {

  // Open dropdown (combobox button)
  cy.get(this.weblocators.roleDropdown)
    .should('be.visible')
    .click();

  // Wait for dropdown options (rendered in portal)
  cy.get(this.weblocators.roleDropdown, { timeout: 10000 })
    .should('be.visible');

   // 3. Select Inspector (robust selector)
  cy.get('[role="listbox"]')
    .find('[role="option"]')
    .contains(/^Insurance Adjuster$/)
    .should('be.visible')
    .click();

  // Verify selection
  cy.get(this.weblocators.roleDropdown)
    .should('contain.text', 'Insurance Adjuster');
}



  validateProjectName(){

    //cy.get(this.weblocators.errorProjectName).should('be.visible').and('contain','Project name is required')
    cy.contains('Project name is required').should('be.visible').and('contain','Project name is required')
 

  }

  
  validateProjectNameForCon(){

    cy.get(this.weblocators.errorProjectNameForCon).should('be.visible').and('contain','Project name is required')

  }


  validateLocation(){

    cy.get(this.weblocators.location).invoke('val').as('location')

  }
  
}

export default dashboardRoleProject;