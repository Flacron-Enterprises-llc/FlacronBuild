

class login {


    //Locators

    weblocators={

       
        email :'input[placeholder="Email"]',
        profileLogo: '#radix-\\3A rb\\3A',
        logout : '#radix-\\:r3\\:',
        profileIcon: '.w-8.h-8.bg-primary.rounded-full.flex.items-center.justify-center',
        password :'input[placeholder="Password"]',
        button:'button[type="submit"]',
        title:'h2[id="radix-:r1:"]',
        googleLoginLink :'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"]',
        signupLink : 'button[class="text-blue-600 underline text-xs hover:text-blue-800"]',
        invalidPwErr: '#radix-\\:r0\\: > :nth-child(3)',
        crossIcon : '.lucide.lucide-x.h-4.w-4',
        dashboard:'.text-3xl.font-bold.text-gray-900',
       
        

    }


  //Methords

  validateGoogleLink(){

    cy.get(this.weblocators.googleLoginLink).should('be.visible')
    

  }

  
  validateCrossIcon(){

    cy.get(this.weblocators.crossIcon).should('be.visible')
    

  }
  clickLogout() {
    // Use the CSS class or aria-label instead of a dynamic ID
    cy.get('.w-8.h-8.bg-primary.rounded-full.flex.items-center.justify-center').first().click({ force: true });
    cy.contains('Logout').click({ force: true });
}

/*
    clickLogout(){

    cy.get(this.weblocators.profileIcon).click({ force: true , multiple: true });
     //  cy.get(this.weblocators.logout).click({ force: true, multiple: true  });
 
   //  cy.contains('div', 'Logout').should('be.visible').click({ force: true });
   cy.contains('Logout').click({ force: true })
    }
  /*

    clickLogout() {
    // 1. Check the body text first to see if "Logout" exists
    cy.get('body').then(($body) => {
        if ($body.text().includes('Logout')) {
            cy.log('✅ Logout button found. Clicking now...');
            // 2. Only click if it's actually there
            cy.contains('Logout').click({ force: true });
        } else {
            // 3. If it's not there, DON'T FAIL. Just clear storage.
            cy.log('⚠️ Logout button not found. Resetting session manually.');
            cy.clearLocalStorage();
            cy.clearCookies();
        }
    });
}

*/

    
    openURL(){
 
     
         cy.visit(Cypress.env('URL'))
    }
  clickProfileIcon(){

        
       cy.get(this.weblocators.profileIcon).click();

    }
    
  

  
  validateHomewnerDashboard(){

    cy.get(this.weblocators.dashboard).should('contain','Homeowner Dashboard')
    

  }

  
  
  validateContractorDashboard(){

    cy.get(this.weblocators.dashboard).should('contain','Contractor Dashboard')
    

  }

  
  
  validateInspectorDashboard(){

    cy.get(this.weblocators.dashboard).should('contain','Inspector Dashboard')
    

  }

  
  validateInsuranceDashboard(){

    cy.get(this.weblocators.dashboard).should('contain','Insurance Adjuster Dashboard')
    

  }
  
   validateSignUpLink(){

    cy.get(this.weblocators.signupLink).should('be.visible')
    

  }
  
     enterValidEmail(Email){
        cy.get(this.weblocators.email).type(Email)
                
    }

    

    validateWindowTitle(){

        cy.get(this.weblocators.title).should('have.text', 'Login');

    }

    enterPassword(password){

         cy.get(this.weblocators.password).type(password)
    }


    
    clickButton(){

        cy.get(this.weblocators.button).click()
    }


    validateEmailField(email){
        cy.get(this.weblocators.email).type(email)
        cy.get(this.weblocators.email).then(($input) => {
    expect($input[0].validationMessage).to.contain('@')
  })
                
    }

     validateEmptyEmail(){

       
 cy.get(this.weblocators.email, { timeout: 20000 }) .scrollIntoView()
  .should('be.visible')
.then(($input) => {
    expect($input[0].validationMessage, { timeout: 20000 }).to.contain('Please fill out this field.')
  })
       
    }

      validateEmptypPw(){

        
 cy.get(this.weblocators.password, { timeout: 20000 }) .scrollIntoView()
  .should('be.visible')
.then(($input) => {
    expect($input[0].validationMessage, { timeout: 20000 }).to.contain('Please fill out this field.')
  })
       
    }



     validateWrongEmail(){

       
       cy.wait(300)

         cy.get(this.weblocators.invalidPwErr)
      .should('be.visible')
      .and('contain.text', 'Firebase: Error ')
       
    }

      validateWrongPassword(){

        
         cy.get(this.weblocators.invalidPwErr)
      .should('be.visible')
      .and('contain.text', 'Firebase: Error (auth/invalid-credential).')
       
    }



}
export default login;