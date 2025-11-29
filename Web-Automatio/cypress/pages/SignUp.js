class SignUp {


    //Locators

    weblocators={

       
        fullName :'.gap-3 > :nth-child(1) > .flex',
        email :'.gap-3 > :nth-child(2) > .flex',
        password:'.gap-3 > :nth-child(3) > .flex',
        conPassword:'.gap-3 > :nth-child(4) > .flex',
        continue :'.gap-3 > .inline-flex',
        title : '#radix-\\3A r4\\3A',
        invalidPwError : ".text-red-500.text-sm.text-center",
        changeasswordError : ".text-red-500.text-sm.text-center",
        EmptyFieldsMsg : '.text-center.text-red-500.text-xs.font-medium.mb-2'

    }


  //Methords

  validateContinueeButtonOnEmptyFields(){

    cy.get(this.weblocators.continue).should('be.disabled')
    

  }
  
     enterFullName(FName){
        cy.get(this.weblocators.fullName).type(FName)
                
    }

     saveEnteredName() {
    return this.elements.FName().invoke('val');
  }

    validatePageTitle(){

        cy.get(this.weblocators.title).should('have.text', 'Sign Up');

    }

    enterEmail(){

         const email = `testuser_${Date.now()}@example.com`;

        cy.get(this.weblocators.email).type(email)
    }


     enterDuplicateEmail(email){

       cy.get(this.weblocators.email).type(email)
    }

       saveEnteredEmail() {
    return this.elements.email().invoke('val');
  }
    enterPassword(Password){

        cy.get(this.weblocators.password, { timeout: 20000 }).type(Password)
        cy.get(this.weblocators.conPassword, { timeout: 20000 }).type(Password)
    }

    
    clickButton(){

        cy.get(this.weblocators.continue).click()
    }


    validateEmailField(email){
        cy.get(this.weblocators.email, { timeout: 20000 }).scrollIntoView()
  .should('be.visible')
.type(email)
        cy.get(this.weblocators.email, { timeout: 20000 }) .scrollIntoView()
  .should('be.visible')
.then(($input) => {
    expect($input[0].validationMessage, { timeout: 20000 }).to.contain('@')
  })
                
    }



    ValidateInvalidPasswordLenght(Password){

        cy.get(this.weblocators.password, { timeout: 20000 }).type(Password)
        cy.get(this.weblocators.conPassword, { timeout: 20000 }).type(Password)
        cy.wait(300)
        cy.get('.gap-3 > .inline-flex',{ timeout: 20000 }).click()
        cy.wait(300)
        cy.get(this.weblocators.invalidPwError,{ timeout: 20000 })   // change selector as per UI
       .should('be.visible')
       .and('contain', 'Password must be at least 6 characters long')

       
    }


     ValidatePsswordandConfirmPasswordChange(Password){

        cy.get(this.weblocators.password).type(Password)
         
        cy.get(this.weblocators.conPassword).type("123456")
        cy.wait(300)
       cy.get('.gap-3 > .inline-flex').click()
       cy.wait(300)

         cy.get(this.weblocators.changeasswordError)
      .should('be.visible')
      .and('contain', 'Passwords do not match')
       
    }



}
export default SignUp;
