import homeCompairPageTest from '../../../pages/compairPage';
import dashboardRoleProject from '../../../pages/role&Project'
import login from '../../../pages/login'
import location from '../../../pages/location'
import roofDetails from '../../../pages/roofDetails'
import materials from '../../../pages/materials'
import role from '../../../pages/role'
import review from '../../../pages/review'
import {faker} from '@faker-js/faker'  //faker for fack data for testing
import myEsrimates from '../../pages/myEstimatesHO'
import contractorRole from '../../../pages/contractorRole'
import inspectorRole from '../../../pages/inspectorRole'
import { generateShortUniqueCompanyName } from '../../../support/utils';
import deleteProjects from '../../pages/deleteProjects';


import { slowCypressDown } from 'cypress-slow-down'

export const step1Obj = new dashboardRoleProject()
export const homecompairObj = new homeCompairPageTest()
export const loginObj = new login()
export const locationObj = new location()
export const roofObj = new roofDetails()
export const matObj = new materials()
export const roleObj = new role()
export const reviewObj = new review()
const estimateObj = new myEsrimates()
const croleObj = new contractorRole()
const iroleObj = new inspectorRole() //for step 5

// import all data json file from fixtures folder
import loginData from '../../../fixtures/loginData.json' //import data file for images and data



describe('Compare Estimates — Homeowner', () => {

  
   
    const reportData = {
    project: '@projectName',
    role: '@mrole',
    location: '@city, @country',
    date: '@date',
    structureType: '@structureType',
    roofPitch: '@roofPitch',
    roofAge: '@roofAge',
    materialLayers: '@materialLayers',
    felt: '@feltType',
    iceWaterShield: '@selectedOptions',
    dripEdge: '@selectedOptions',
    gutterApron: '@selectedOptions',
    homeownerName: 'Qwkhire3',
   // homeownerEmail: loginData.HEmail ,
    language: '@language',
    currency: '@currency'
  };

    
    beforeEach(() => {
    
       cy.task("clearDownloadsFolder");
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.window().then((win) => {
        win.sessionStorage.clear();
       
      });
    
    
      loginObj.openURL();
      
      cy.get('body').should('be.visible').then(($body) => {
          
          // FIX: Use :contains (jQuery) instead of :has-text (Playwright)
          const isEmailVisible = $body.find('input[placeholder="Email"]').length > 0;
          const isProfileMenuVisible = $body.find('button[aria-haspopup="menu"]').length > 0;
          const isLandingPageVisible = $body.find('span:contains("Get Your Estimate")').length > 0;
      
          // SCENARIO 1: Login Form is already open
          if (isEmailVisible) {
              cy.log('👉 Scenario 1: On Login Window');
              loginObj.enterValidEmail(loginData.HEmail);
              loginObj.enterPassword(loginData.Hpassword);
              loginObj.clickButton();
          } 
          
          // SCENARIO 2: Already Logged In (Profile menu exists)
          else if (isProfileMenuVisible) {
              cy.log('👉 Scenario 2: Already Logged In - Resetting via Logout');
              loginObj.clickLogout(); 
              cy.reload(); // Force a fresh state
              loginObj.clickProfileIcon();
              cy.get('input[placeholder="Email"]', { timeout: 10000 }).should('be.visible').type(loginData.HEmail);
              loginObj.enterPassword(loginData.Hpassword);
              loginObj.clickButton();
          } 
          
          // SCENARIO 3: Landing Page (Fallback)
          else if (isLandingPageVisible) {
              cy.log('👉 Scenario 3: On Landing Page - Clicking Profile');
              loginObj.clickProfileIcon(); 
              
              // Wait for React to render the modal/form
              cy.get('input[placeholder="Email"]', { timeout: 15000 })
                  .should('be.visible')
                  .type(loginData.HEmail);
          
              loginObj.enterPassword(loginData.Hpassword);
              loginObj.clickButton();
          }
      });
          
          
        // cy.ensureLoggedIn(loginData.HEmail, loginData.Hpassword)
      })
      slowCypressDown(300) 
      



  it('TC-01 — Select projects enables compare', { retries: 2 },() => {

    //first create 1 project

    
          //  Enter and SAVE Project Name
          cy.log("======= Entring Data in step 1 ======")
   
  const projectName = generateShortUniqueCompanyName('TestOne');
         step1Obj.enterProjectName(projectName) 

         cy.wrap(projectName).as('savedProjectName')
        step1Obj.validateYourRoleForHomeowner()
     // step1Obj.selectProjectType()
      step1Obj.clickNextButton()
      cy.log("======= Entring Data in step 2 ======")
      step1Obj.validateStep2()
     locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');
    
    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');
    
    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

      // SAVE IT as a string for later use (PDF validation)
    
      locationObj.clickNextButton()
    
    cy.log("======= Entring Data in steps 3 ======")
    cy.log("======= Selecting random Roof Structure Type and saving data  ======")
    roofObj.selectRandomStructureType()
    
    cy.get('@structureType').then(val => {
      cy.log("Selected:", val);
    });
    
    cy.log("======= Selecting random  Roof Pitch and saving data ======")
    
    roofObj.selectRandomRoofPitch()
    
    cy.get('@roofPitch').then(val => {
      cy.log("Selected:", val);
    });
    
    roofObj.enterRoofAge(faker.string.numeric(2)) //save roof age
    
    roofObj.ClickNextButton()
    // step 4 start
    
    cy.log("======= Entring Data in Step 4 ======")
    matObj.validateStage()
    matObj.validateTitle()
    cy.log("======= Selecting random option from dropdown menu and saveing it ======")
    matObj.selectRandomMaterialSingle()
    
    cy.get('@layer').then(val => {
      cy.log("Selected:", val);
    });
    
    matObj.clickNextButton()
    roleObj.clickNextButton()
    cy.log("======= Starting step 6: varifying entred data in all steps ======")
   reviewObj.clickGenerateEstimateButton()
    cy.wait(2000)
    
    reviewObj.validatedProjectGenerated()
    cy.wait(2000)
    reviewObj.verifySucessMessage()
    cy.wait(2000)
    
    cy.contains('Home').click({force: true})
    cy.wait(100)
    
   
    //now create an other project for compair

          //  Enter and SAVE Project Name
          cy.log("======= Entring Data in step 1 for 2nd project ======")
           cy.wait(4000)
          cy.contains('Home').click({force: true})
    const projectName1 = generateShortUniqueCompanyName('Test2');
         step1Obj.enterProjectName2(projectName1)
         cy.wrap(projectName1 ).as('savedProjectName2')
        step1Obj.validateYourRoleForHomeowner()
     // step1Obj.selectProjectType()
      step1Obj.clickNextButton()
      cy.log("======= Entring Data in step 2 ======")
   
     locationObj.enterCountry('USA');
    cy.wrap('USA').as('country1');
    
    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city1');
    
    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode1');
      // SAVE IT as a string for later use (PDF validation)
    
      locationObj.clickNextButton()
    
    cy.log("======= Entring Data in steps 3 ======")
    cy.log("======= Selecting random Roof Structure Type and saving data  ======")

    roofObj.selectRandomStructureType2()
    
    cy.get('@structureType2').then(val => {
      cy.log("Selected:", val);
    });
    
    cy.log("======= Selecting random  Roof Pitch and saving data ======")
    
    roofObj.selectRandomRoofPitch2()
    
    cy.get('@roofPitch2').then(val => {
      cy.log("Selected:", val);
    });
    
    roofObj.enterRoofAge2(faker.string.numeric(2)) //save roof age
    
    roofObj.ClickNextButton()
    // step 4 start
    
    cy.log("======= Entring Data in Step 4 ======")
   
    cy.log("======= Selecting random option from dropdown menu and saveing it ======")
    matObj.selectRandomMaterialSingle2()
    
    cy.get('@layer2').then(val => {
      cy.log("Selected:", val);
    });
    
    matObj.clickNextButton()
    roleObj.clickNextButton()
    cy.log("======= Starting step 6: varifying entred data in all steps ======")
    
 
    reviewObj.clickGenerateEstimateButton()
    cy.wait(2000)

    //now first search first created project and select it,than create 2nd project and select it and click button
   
    homecompairObj.openComparePage();
             cy.wait(1000) 
    homecompairObj.openComparePage();
     homecompairObj.searchProject(projectName);
  //  homecompairObj.filterByDate()
    cy.wait(500)
     homecompairObj.selectProject()
     cy.wait(2000)
    homecompairObj.openComparePage();
     homecompairObj.searchProject(projectName1);
     homecompairObj.selectProject()
     cy.wait(1000)
    //  homecompairObj.validateCompareEnabled();
   // cy.contains('Compare Selected').click()
   homecompairObj.clickCompare()
    cy.wait(500)


// ... after homecompairObj.clickCompare() ...
cy.wait(2000); // Give the comparison page time to render both cards

// Use aliases to build both validation sets
cy.get('@savedProjectName').then(projectName1 => {
  cy.get('@structureType').then(structure1 => {
    cy.get('@savedProjectName2').then(projectName2 => {
      cy.get('@structureType2').then(structure2 => {

        // Project 1 Data (Index 0)
        const validationSet1 = {
          "Project:": projectName1,
          "Location:": "Houston, USA 77001",
          "Structure Type:": structure1,
          "Felt:": 'none',
          "Drip Edge:": 'No', // Updated to match your image e2.png logic
          "Preferred Currency:": 'USD'
        };

        // Project 2 Data (Index 1)
        const validationSet2 = {
          "Project:": projectName2,
          "Location:": "Houston, USA 77001",
          "Structure Type:": structure2,
          "Felt:": 'none',
          "Drip Edge:": 'No',
          "Preferred Currency:": 'USD'
        };

        // VALIDATE BOTH CARDS
        cy.log("Validating First Project Card");
        homecompairObj.validateReportByProject(projectName1, validationSet1);

        cy.log("Validating Second Project Card");
        homecompairObj.validateReportByProject(projectName1, validationSet1);

      });
    });
  });
});     
 
loginObj.clickLogout();
   

  });


  it('TC-02 — Invalid search shows message',{ retries: 2 }, () => {
    
    cy.wait(300)
    homecompairObj.openComparePage();
    homecompairObj.searchProject('invalid-project');
    homecompairObj.validateNoResults();
     loginObj.clickLogout();
  });




  it('TC-03 — PDF buttons visible', { retries: 2 },() => {

  
    //first create 1 project

    
          //  Enter and SAVE Project Name
          cy.log("======= Entring Data in step 1 ======")
    const projectName = generateShortUniqueCompanyName('Test3');
         step1Obj.enterProjectName(projectName) 

         cy.wrap(projectName).as('savedProjectName')
        step1Obj.validateYourRoleForHomeowner()
     // step1Obj.selectProjectType()
      step1Obj.clickNextButton()
      cy.log("======= Entring Data in step 2 ======")
      step1Obj.validateStep2()
     locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');
    
    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');
    
    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

      // SAVE IT as a string for later use (PDF validation)
    
      locationObj.clickNextButton()
    
    cy.log("======= Entring Data in steps 3 ======")
    cy.log("======= Selecting random Roof Structure Type and saving data  ======")
    roofObj.selectRandomStructureType()
    
    cy.get('@structureType').then(val => {
      cy.log("Selected:", val);
    });
    
    cy.log("======= Selecting random  Roof Pitch and saving data ======")
    
    roofObj.selectRandomRoofPitch()
    
    cy.get('@roofPitch').then(val => {
      cy.log("Selected:", val);
    });
    
    roofObj.enterRoofAge(faker.string.numeric(2)) //save roof age
    
    roofObj.ClickNextButton()
    // step 4 start
    
    cy.log("======= Entring Data in Step 4 ======")
    matObj.validateStage()
    matObj.validateTitle()
    cy.log("======= Selecting random option from dropdown menu and saveing it ======")
    matObj.selectRandomMaterialSingle()
    
    cy.get('@layer').then(val => {
      cy.log("Selected:", val);
    });
    
    matObj.clickNextButton()
    roleObj.clickNextButton()
    cy.log("======= Starting step 6: varifying entred data in all steps ======")
   reviewObj.clickGenerateEstimateButton()
    cy.wait(2000)
    
    reviewObj.validatedProjectGenerated()
    cy.wait(2000)
    reviewObj.verifySucessMessage()
    cy.wait(2000)
    
    cy.contains('Home').click({force: true})
    cy.wait(100)
    
   
    //now create an other project for compair

          //  Enter and SAVE Project Name
          cy.log("======= Entring Data in step 1 for 2nd project ======")
           cy.wait(4000)
          cy.contains('Home').click({force: true})
    const projectName1 = generateShortUniqueCompanyName('TestOne');
         step1Obj.enterProjectName2(projectName1)
         cy.wrap(projectName1 ).as('savedProjectName2')
        step1Obj.validateYourRoleForHomeowner()
     // step1Obj.selectProjectType()
      step1Obj.clickNextButton()
      cy.log("======= Entring Data in step 2 ======")
   
     locationObj.enterCountry('USA');
    cy.wrap('USA').as('country1');
    
    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city1');
    
    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode1');
      // SAVE IT as a string for later use (PDF validation)
    
      locationObj.clickNextButton()
    
    cy.log("======= Entring Data in steps 3 ======")
    cy.log("======= Selecting random Roof Structure Type and saving data  ======")

    roofObj.selectRandomStructureType2()
    
    cy.get('@structureType2').then(val => {
      cy.log("Selected:", val);
    });
    
    cy.log("======= Selecting random  Roof Pitch and saving data ======")
    
    roofObj.selectRandomRoofPitch2()
    
    cy.get('@roofPitch2').then(val => {
      cy.log("Selected:", val);
    });
    
    roofObj.enterRoofAge2(faker.string.numeric(2)) //save roof age
    
    roofObj.ClickNextButton()
    // step 4 start
    
    cy.log("======= Entring Data in Step 4 ======")
   
    cy.log("======= Selecting random option from dropdown menu and saveing it ======")
    matObj.selectRandomMaterialSingle2()
    
    cy.get('@layer2').then(val => {
      cy.log("Selected:", val);
    });
    
    matObj.clickNextButton()
    roleObj.clickNextButton()
    cy.log("======= Starting step 6: varifying entred data in all steps ======")
    
 
    reviewObj.clickGenerateEstimateButton()
    cy.wait(2000)

    //now first search first created project and select it,than create 2nd project and select it and click button
   
    homecompairObj.openComparePage();
             cy.wait(1000) 
    homecompairObj.openComparePage();
     homecompairObj.searchProject(projectName);
  //  homecompairObj.filterByDate()
    cy.wait(500)
     homecompairObj.selectProject()
     cy.wait(2000)
    homecompairObj.openComparePage();
     homecompairObj.searchProject(projectName1);
     homecompairObj.selectProject()
     cy.wait(1000)
   
   homecompairObj.clickCompare()
    cy.wait(500)

    homecompairObj.validatePdfButtons()
     
    loginObj.clickLogout();
   
});


  it('TC-04 — Back navigation', () => {
    cy.wait(2000)
    
     homecompairObj.openComparePage();

     homecompairObj.searchProject("Test2_OUZIG");
  //  homecompairObj.filterByDate()
    cy.wait(500)
     homecompairObj.selectProject()
     cy.wait(2000)
    homecompairObj.openComparePage();
     homecompairObj.searchProject("intuitive36");
     homecompairObj.selectProject()
     cy.wait(1000)
    //  homecompairObj.validateCompareEnabled();
   // cy.contains('Compare Selected').click()
   homecompairObj.clickCompare()

   homecompairObj.goBack()
   cy.contains("Go Back to Homepage").should("be.visible")
     loginObj.clickLogout();
  });

   it('TC-05 — Check Compair Selected button without selecting 2 project', () => {
      cy.wait(2000)
      
       homecompairObj.openComparePage();
  
       homecompairObj.searchProject("Test2_OUZIG");
  
      cy.wait(500)
       homecompairObj.selectProject()
       cy.wait(2000)
      homecompairObj.openComparePage();
   
      
     homecompairObj.clickCompareBt()
  
       loginObj.clickLogout();
    });



    it.only('Delete all projects from My Estimates page', () => {

      cy.wait(200)

        cy.contains('My Estimates').click({force: true})


        deleteProjects.deleteAllProjects();

    });
  
});
