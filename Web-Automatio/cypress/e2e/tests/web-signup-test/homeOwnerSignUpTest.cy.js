

import SignUp from '../../../pages/SignUp'
import homePage from '../../../pages/homePage'
import loginPage from '../../../pages/loginPage'
import choosePlanPage from '../../../pages/choosePlanPage'
import homeOwnerProfilePage from '../../../pages/homeOwnerProfilePage'
import reviewPage from '../../../pages/ReviewPage'
import {faker} from '@faker-js/faker'  //faker for fack data for testing
import profileSettingPage from '../../../pages/profileSettingPage'

// object for each impored class 
const signupObj = new SignUp()
const homeObj = new homePage()
const loginObj = new loginPage()
const choosePlanObj = new choosePlanPage()
const yourProfileObj = new homeOwnerProfilePage()
const reviewPageObj = new reviewPage()
const profilePageObj = new profileSettingPage()



// import all data json file from fixtures folder
import signUpData from '../../../fixtures/signUpData.json' //import data file
import yourProfilePageData from '../../../fixtures/yourProfilePageData.json' //import data for Your Profile Page

 

describe('Test SignUp Flow for HomeOwner' ,()=>{
       it('User selects plan HomeOwner and verifies on review page with valid data', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

      signupObj.validatePageTitle() //validate Page Title

       //  Enter and SAVE Full Name
    const fullName = faker.person.firstName()
           signupObj.enterFullName(fullName)
           cy.wrap(fullName).as('savedFullName')
     
    //  Enter and SAVE Email
    const email = faker.internet.email()
    signupObj.enterEmail(email)
    cy.wrap(email).as('savedEmail')

      // signupObj.enterPassword(signUpData.password)
      signupObj.enterPassword(faker.internet.password({ length: 6 }))
       signupObj.clickButton()

       cy.log("======= Selecting Plan ======")
       //validation

         // Plan selection
    const selectedPlan = 'Homeowner';  // Can be changed to any card
    const billingType = 'monthly';      // monthly / yearly

   
   // chosePObj.clickContinueButton();


       choosePlanObj.validateTitle();
       choosePlanObj.validateBackButton()
       choosePlanObj.validateContractorCard();
       choosePlanObj.validateHomeOwnerCard();
       choosePlanObj.validateInspectorCard();
       choosePlanObj.validateInsuranceAdjusterCard();
       choosePlanObj.validateMonthlyTag();
       //choosePlanObj.validateYearlybtn
      choosePlanObj.validatePopularText();
       //choose plan
     //  choosePlanObj.chooseHomeOwner(); 

        choosePlanObj.selectBilling(billingType);
    choosePlanObj.selectPlan(selectedPlan);
    choosePlanObj.clickContinueButton();

       //click continuee button
    //   choosePlanObj.clickContinueButton();

       cy.log("======= Selecting Budget Rang ======")    

       //validation
       yourProfileObj.validateTitle();
       yourProfileObj.validateBackButton();
       yourProfileObj.validateLoginLink();
       
       // Select random from each dropdown menu on Your Profile window
     
      cy.wait(1000)
       yourProfileObj.selectRandomBudget()
       yourProfileObj.selectRandomUrgency()
       yourProfileObj.selectRandomTimeFrame()
       
       yourProfileObj.clickNext()

       cy.log("======= Review Page ======")    

       //validattion on Review page
       reviewPageObj.validatePageTitle()
      // reviewPageObj.validateBackButton()
       reviewPageObj.validateDataBox()
       signUpData.saveEnteredName
        reviewPageObj.verifyPlanDetails();  // Dynamically verify plan, billing, price

      // reviewPageObj.validateData()   

      //validate user input data should save in database and should displayed correct as user entred at the time of registration

       reviewPageObj.validateLoginLink()

       // click button
       reviewPageObj.clickStartSubButton()

   cy.wait(1000)
   cy.scrollTo('top');
   cy.wait(1000)

     // Profile validation and logout
   profilePageObj.validateProfileIcon() 
           cy.log("======= Testing Logout ======")
           cy.wait(1000)
    profilePageObj.clickLogout()
    homeObj.varifyHomePage() //varifies user hase logout successfully

    })



// nagative TC

 it('Validate SignUp process with duplicate email', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

      signupObj.validatePageTitle() //validate Page Title

       //  Enter and SAVE Full Name
    const fullName = faker.person.firstName()
           signupObj.enterFullName(fullName)
           cy.wrap(fullName).as('savedFullName')
     
    //  Enter and SAVE Email
  
      const email = "test@test.com"
    signupObj.enterDuplicateEmail(email)
    cy.wrap(email).as('savedEmail')

      // signupObj.enterPassword(signUpData.password)
      signupObj.enterPassword(faker.internet.password({ length: 6 }))
       signupObj.clickButton()

       cy.log("======= Selecting Plan ======")
       //validation

         // Plan selection
    const selectedPlan = 'Homeowner';  // Can be changed to any card
    const billingType = 'monthly';      // monthly / yearly

   
   // chosePObj.clickContinueButton();


       choosePlanObj.validateTitle();
       choosePlanObj.validateBackButton()
       choosePlanObj.validateContractorCard();
       choosePlanObj.validateHomeOwnerCard();
       choosePlanObj.validateInspectorCard();
       choosePlanObj.validateInsuranceAdjusterCard();
       choosePlanObj.validateMonthlyTag();
       //choosePlanObj.validateYearlybtn
      choosePlanObj.validatePopularText();
       //choose plan
     //  choosePlanObj.chooseHomeOwner(); 
    choosePlanObj.selectBilling(billingType);
    choosePlanObj.selectPlan(selectedPlan);
    choosePlanObj.clickContinueButton();

       //click continuee button
    //   choosePlanObj.clickContinueButton();

       cy.log("======= Selecting Budget Rang ======")    

       //validation
       yourProfileObj.validateTitle();
       yourProfileObj.validateBackButton();
       yourProfileObj.validateLoginLink();
       
       // Select random from each dropdown menu on Your Profile window
     
      cy.wait(1000)
       yourProfileObj.selectRandomBudget()
       yourProfileObj.selectRandomUrgency()
       yourProfileObj.selectRandomTimeFrame()
       
       yourProfileObj.clickNext()

       cy.log("======= Review Page ======")    

       //validattion on Review page
       reviewPageObj.validatePageTitle()
        cy.wait(1000)
      // reviewPageObj.validateBackButton()
       reviewPageObj.validateDataBox()
        cy.wait(1000)
       signUpData.saveEnteredName
        cy.wait(1000)
        reviewPageObj.verifyPlanDetails();  // Dynamically verify plan, billing, price

      // reviewPageObj.validateData()   

      //validate user input data should save in database and should displayed correct as user entred at the time of registration

       cy.wait(1000)

       // click button
       reviewPageObj.clickStartSubButton()

        cy.wait(1000)
         reviewPageObj.validateDuplicateEmail()
      

    cy.wait(1000)
   cy.scrollTo('top');
    cy.wait(1000)

   

    })

    // email field with invalud email

 it('Validate Email field', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

      signupObj.validatePageTitle() //validate Page Title

       //  Enter and SAVE Full Name
    const fullName = faker.person.firstName()
           signupObj.enterFullName(fullName)
            cy.wait(1000)
     
    //  Validate Email Field
   
     //  Enter and SAVE Email
 
    signupObj.validateEmailField("test")
 cy.wait(1000)
      // signupObj.enterPassword(signUpData.password)
      signupObj.enterPassword(faker.internet.password({ length: 6 }))
       cy.wait(1000)
       signupObj.clickButton()
        cy.wait(1000)

      
    })

// Validate Password field lenght

    it('should show validation error for password less than 6 characters', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

      signupObj.validatePageTitle() //validate Page Title

       //  Enter and SAVE Full Name
    const fullName = faker.person.firstName()
           signupObj.enterFullName(fullName)
           
     
    //  Validate Email Field
   const email = faker.internet.email()
    signupObj.enterEmail(email)
 

      // signupObj.enterPassword(signUpData.password)
      signupObj.enterPassword(faker.internet.password({ length: 5 }))
       signupObj.clickButton()

     
    })

    //validate password and confirm password fields with different data 

 it('Validate error message on Providing different password in password in confirm password fields', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

      signupObj.validatePageTitle() //validate Page Title

       //  Enter and SAVE Full Name
    const fullName = faker.person.firstName()
           signupObj.enterFullName(fullName)
           
     
    //  Validate Email Field
   
    const email = faker.internet.email()
    signupObj.enterEmail(email)
 

      // signupObj.enterPassword(signUpData.password)
     
      signupObj.ValidatePsswordandConfirmPasswordChange(faker.internet.password({ length: 6 }))

      
       signupObj.clickButton()

       cy.log("======= Selecting Plan ======")
       //validation

    })

    //validate Continuee button on empty fields should be disable
    
    it('Validate Continuee Button on Empty Fields', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

      signupObj.validateContinueeButtonOnEmptyFields()
    })


    //validate nect button should be disable on not selecting dropdown menus


    it('validateDropdownsAndButton', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Entring Data ======")

      signupObj.validatePageTitle() //validate Page Title

       //  Enter and SAVE Full Name
    const fullName = faker.person.firstName()
           signupObj.enterFullName(fullName)
           cy.wrap(fullName).as('savedFullName')
     
    //  Enter and SAVE Email
    const email = faker.internet.email()
    signupObj.enterEmail(email)
    cy.wrap(email).as('savedEmail')

      // signupObj.enterPassword(signUpData.password)
      signupObj.enterPassword(faker.internet.password({ length: 6 }))
       signupObj.clickButton()

       cy.log("======= Selecting Plan ======")
       //validation

         // Plan selection
    const selectedPlan = 'Homeowner';  // Can be changed to any card
    const billingType = 'monthly';      // monthly / yearly

   
   // chosePObj.clickContinueButton();


       choosePlanObj.validateTitle();
       choosePlanObj.validateBackButton()
       choosePlanObj.validateContractorCard();
       choosePlanObj.validateHomeOwnerCard();
       choosePlanObj.validateInspectorCard();
       choosePlanObj.validateInsuranceAdjusterCard();
       choosePlanObj.validateMonthlyTag();
       //choosePlanObj.validateYearlybtn
      choosePlanObj.validatePopularText();
       //choose plan
     //  choosePlanObj.chooseHomeOwner(); 

        choosePlanObj.selectBilling(billingType);
    choosePlanObj.selectPlan(selectedPlan);
    choosePlanObj.clickContinueButton();

       //click continuee button
    //   choosePlanObj.clickContinueButton();

       cy.log("======= Selecting Budget Rang ======")    

       //validation
       
     yourProfileObj.validateDropdownAndButton()
       
    })


       
})
