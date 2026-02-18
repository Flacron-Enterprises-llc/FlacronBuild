

import login from '../../../pages/login'
// object for each impored class 
const loginObj = new login()

// import all data json file from fixtures folder
import loginData from '../../../fixtures/loginData.json' //import data file


describe('Test Login Flow for Insurance Adjuster' ,()=>{
       it('Login with valid Email and Password', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
      
       loginObj.openURL()
       
       cy.log("======= Clicking Profile icon ======")
       loginObj.clickProfileIcon()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

     loginObj.enterValidEmail(loginData.DEmail);
    loginObj.enterPassword(loginData.Dpassword);
    loginObj.clickButton()
    loginObj.validateInsuranceDashboard()
    loginObj.clickLogout()

    })



// nagative TC

 it('Validate Login with invalid email', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
             loginObj.openURL()
    
       cy.log("======= Clicking profile icon ======")
         loginObj.clickProfileIcon()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

     loginObj.enterValidEmail("ali@gmal.com");
    loginObj.enterPassword(loginData.Dpassword);
    loginObj.clickButton()
    loginObj.validateWrongEmail()


  
  })

    // email field with invalud email

 it('Validate with invalid password', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       loginObj.openURL()
       cy.log("======= Clicking profile icon ======")
        loginObj.clickProfileIcon()
       cy.log("======= Clicking SignUp Link from login window ======")
      
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")
      
    
     loginObj.enterValidEmail(loginData.DEmail);
    loginObj.enterPassword("123123");
    loginObj.clickButton()
    loginObj.validateWrongPassword()
   
      
    })



    it('validate empty email field error ', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       loginObj.openURL()
       cy.log("======= Clicking profile icon ======")
       loginObj.clickProfileIcon()
       cy.log("======= Entring Data ======")
      
       loginObj.enterPassword("123123");
       loginObj.clickButton()
      loginObj.validateEmptyEmail()



    })

     
    it('validate empty password field error ', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       loginObj.openURL()
       cy.log("======= Clicking profile icon ======")
       loginObj.clickProfileIcon()
       cy.log("======= Entring Data ======")
      
       loginObj.enterValidEmail(loginData.DEmail);
       loginObj.clickButton()
      loginObj.validateEmptypPw()



    })

      
    it('validate window title', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       loginObj.openURL()
       cy.log("======= Clicking profile icon ======")
       loginObj.clickProfileIcon()
       
      loginObj.validateWindowTitle()

    })
     it('validate Signup Link', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       loginObj.openURL()
       cy.log("======= Clicking profile icon ======")
       loginObj.clickProfileIcon()
       
      loginObj.validateSignUpLink()

    })

        it('validate Google Login Link', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       loginObj.openURL()
       cy.log("======= Clicking profile icon ======")
       loginObj.clickProfileIcon()
       
      loginObj.validateGoogleLink()

    })

    
        it('validate Cross icon', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       loginObj.openURL()
       cy.log("======= Clicking profile icon ======")
       loginObj.clickProfileIcon()
       
      loginObj.validateCrossIcon()

    })

    })
