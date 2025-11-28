

import SignUp from '../../../pages/SignUp'
import homePage from '../../../pages/homePage'
import loginPage from '../../../pages/loginPage'
import choosePlanPage from '../../../pages/choosePlanPage'
import insuranceProfilePage from '../../../pages/insuranceProfilePage'
import reviewPage from '../../../pages/ReviewPage'
import {faker} from '@faker-js/faker'  //faker for fack data for testing
import profileSettingPage from '../../../pages/profileSettingPage'

// object for each impored class 
const signupObj = new SignUp()
const homeObj = new homePage()
const loginObj = new loginPage()
const choosePlanObj = new choosePlanPage()
const ProfileObj = new insuranceProfilePage()
const reviewPageObj = new reviewPage()
const profilePageObj = new profileSettingPage()



// import all data json file from fixtures folder
import signUpData from '../../../fixtures/signUpData.json' //import data file
 

describe('Test SignUp Flow of Contractor' ,()=>{
       it('User selects plan Insurnce Adjuster and verifies on review page with valid data', ()=>{

       cy.log("======= Testing Login ======")
       cy.log("======= Open Web application ======")
       homeObj.openURL()
       cy.log("======= Clicking Get start Estimation Button ======")
       homeObj.clickGetStartButton()
       cy.log("======= Clicking SignUp Link from login window ======")
       loginObj.clickSignUpLink()
      // signupObj.enterFullName(signUpData.FName)
      cy.log("======= Enter Data ======")

      signupObj.validatePageTitle() //validate Page Title

       //  Enter and SAVE Full Name
    const fullName = faker.person.firstName()
           signupObj.enterFullName(fullName)
           cy.wrap(fullName).as('savedFullName')
     
    // Enter and SAVE Email
    const email = faker.internet.email()
    signupObj.enterEmail(email)
    cy.wrap(email).as('savedEmail')

      // signupObj.enterPassword(signUpData.password)
      signupObj.enterPassword(faker.internet.password({ length: 6 }))
       signupObj.clickButton()

       cy.log("======= Selecting Plan ======")
       //validation

         // Plan selection
    const selectedPlan = 'Insurance Adjuster';  // Can be changed to any card and use same name
    const billingType = 'yearly';      // monthly / year

   
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

       cy.log("======= Selecting data from dropdown menues for Your profile page ======")    

       //validation
       ProfileObj.validateTitle();
       ProfileObj.validateBackBtn();
       ProfileObj.validateLoginLink();
       
       // Select random from each dropdown menu on Your Profile window
     
      cy.wait(1000)

       ProfileObj.enterCompanyName(faker.company.name())
       ProfileObj.enterAdjusterID(faker.number.romanNumeral())
       ProfileObj.selectRandomClaimTypesHandledOptions()
       ProfileObj.enterJurisdictionLocation(faker.location.secondaryAddress())

        cy.wait(1000)
       ProfileObj.clickNext()
     

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

   cy.wait(400)
   cy.scrollTo('top');
   cy.wait(400)

     // Profile validation and logout
   profilePageObj.validateProfileIcon() 
           cy.log("======= Testing Logout ======")
           cy.wait(400)
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
    const selectedPlan = 'Insurance Adjuster';  // Can be changed to any card
    const billingType = 'yearly';      // monthly / yearly

   
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

       cy.log("======= Selecting Your Profile Page ======")    

       //validation
       ProfileObj.validateTitle();
       ProfileObj.validateBackBtn();
       ProfileObj.validateLoginLink();
       
       // Select random from each dropdown menu on Your Profile window
     
      cy.wait(1000)
       
       ProfileObj.enterCompanyName(faker.company.name())
       ProfileObj.enterAdjusterID(faker.number.romanNumeral())
       ProfileObj.selectRandomClaimTypesHandledOptions()
       ProfileObj.enterJurisdictionLocation(faker.location.secondaryAddress())
        
       cy.wait(1000)
       ProfileObj.clickNext()

       cy.log("======= Review Page ======")    

       //validattion on Review page
       reviewPageObj.validatePageTitle()
      // reviewPageObj.validateBackButton()
       reviewPageObj.validateDataBox()
       signUpData.saveEnteredName
        reviewPageObj.verifyPlanDetails();  // Dynamically verify plan, billing, price

       reviewPageObj.clickStartSubButton()

       cy.wait(300)
         reviewPageObj.validateDuplicateEmail()
      

   cy.wait(400)
   cy.scrollTo('top');
   cy.wait(400)

   

    })

})
