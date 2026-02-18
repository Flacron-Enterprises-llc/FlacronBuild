class role{



    
    //Locators

    weblocators={

        //step 5   
       roleTitle: '.text-lg.font-medium.text-neutral-800',
       step5: '.text-sm.text-neutral-500',
       name2: '#\\:r5m\\:-form-item',
       name: '[name="homeownerInfo.name"]',
       email2: '#\\:r5n\\:-form-item',
       email: '[name="homeownerInfo.email"]',
       emailError: '',
       projectUrgencyDropdown2: '#\\:r5o\\:-form-item',
      projectUrgencyDropdown: 'button[role="combobox"]:has(span:contains("Select urgency"))',


       budgetStyleDropDown2: '#\\:r5q\\:-form-item',
       budgetStyleDropDown: 'button[role="combobox"]:has(span:contains("Select budget style"))',
       languageDropDown2: '#\\:r5s\\:-form-item',
       languageDropDown: 'button[role="combobox"]:has(span:contains("Select language"))',

       currencyDropDown2: '#\\:r5u\\:-form-item',
       currencyDropDown: 'button[role="combobox"]:has(span:contains("Select currency"))',
       processWindow: '.text-center.mb-8',
       nextButton: '.pt-6 > .flex > .inline-flex',
       preButton: 'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"]',
       //optional upload
       confirmationMsg: 'body > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > ol:nth-child(1)',
       
        

    }


  //Methords

  validateTitle(){

    cy.get(this.weblocators.roleTitle).should('contain','Role Specific')
    

  }

  validateStage(){

    cy.get(this.weblocators.step5).should('contain','Step 5 / 6')
    

  }
  
  enterName(Name){

    cy.get(this.weblocators.name).type(Name).as('Name')
    
  }

  
  enterEmail(Email){

    cy.get(this.weblocators.email).type(Email).as('Email')
    
  }


  
  enterInvalidEmail(){


   cy.get(errorTextSelector)
      .should("be.visible")
      .and("contain", expectedErrorText);

    cy.log("Invalid email error verified successfully.");

    
    
  }

   selectProjectUrgency(){

    cy.selectRandom(this.weblocators.projectUrgencyDropdown).as('projectselectRandom').then(selected => {
    cy.log("Selected value for project urgency:", selected);
});
  
    
  }

  

   selectProjectUrgency2(){

    cy.selectRandom(this.weblocators.projectUrgencyDropdown2).as('projectselectRandom').then(selected => {
    cy.log("Selected value for project urgency:", selected);
});
  
    
  }


  selectBudgetStyle(){

    cy.selectRandom(this.weblocators.budgetStyleDropDown).as('budgetStyle').then(selected => {
    cy.log("Selected value for budget style:", selected);
  });
    
  }

  
  selectBudgetStyle2(){

    cy.selectRandom(this.weblocators.budgetStyleDropDown2).as('budgetStyle').then(selected => {
    cy.log("Selected value for budget style:", selected);
  });
    
  }

   selectLanguage(){

    cy.selectRandom(this.weblocators.languageDropDown).as('language').then(selected => {
    cy.log("Selected value for language:", selected);
});
    
  }

  
   selectLanguage2(){

    cy.selectRandom(this.weblocators.languageDropDown2).as('language').then(selected => {
    cy.log("Selected value for language:", selected);
});
    
  }

  selectCurrency(){

    cy.selectRandom(this.weblocators.currencyDropDown).as('currency').then(selected => {
    cy.log("Selected value for currency :", selected);
});
    
  }

  
  selectCurrency2(){

    cy.selectRandom(this.weblocators.currencyDropDown2).as('currency').then(selected => {
    cy.log("Selected value for currency :", selected);
});
    
  }

  clickNextButton(){

    cy.get(this.weblocators.nextButton).click()
  }

  clickPreButton(){

    //cy.selectRandom(this.weblocators.preButton).click()
    cy.contains('Previous').click()
      }

  validateInvalidEmail(){

  
    cy.get(this.weblocators.emailError).should('contain','invalid email')

  

  }


  
}

export default role;