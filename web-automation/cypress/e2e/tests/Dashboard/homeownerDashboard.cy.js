

import dashboardRoleProject from '../../../pages/role&Project'
import login from '../../../pages/login'
import location from '../../../pages/location'
import roofDetails from '../../../pages/roofDetails'
import materials from '../../../pages/materials'
import role from '../../../pages/role'
import review from '../../../pages/review'
import {faker} from '@faker-js/faker'  //faker for fack data for testing
import  myEsrimates from '../../../pages/myEstimatesHO'


//for PDF report validation
import { reportData } from '../../../support/reportDataStore'
import { buildPdfFileName } from '../../../support/pdfHelper'; //for geting project name
import { slowCypressDown } from 'cypress-slow-down'

// object for each impored class 
export const step1Obj = new dashboardRoleProject()
export const loginObj = new login()
export const locationObj = new location()
export const roofObj = new roofDetails()
export const matObj = new materials()
export const roleObj = new role()
export const reviewObj = new review()
const estObj = new myEsrimates()


// import all data json file from fixtures folder
import loginData from '../../../fixtures/loginData.json' //import data file for images and data

describe('Enter and validate data for Homeowner Project' ,()=>{
beforeEach(() => {
 cy.task("clearDownloadsFolder");
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
   
  });


  loginObj.openURL();


// Give Next.js time to load the session
    

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
slowCypressDown(200) 

 it('TC-1: Create project and validate without filling stage 5 and extra layers',{ retries: 2 }, function() {
      
      //  Enter and SAVE Project Name
      cy.log("======= Entring Data in step 1 ======")
const projectName = faker.company.buzzAdjective()
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

reviewObj.validateStage()
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
//reviewObj.varifyProjectType()
reviewObj.verifyLocation()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()
//reviewObj.varifyUploadedFile1()
reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(2000)

cy.contains('Home').click({force: true})
cy.wait(100)
cy.contains('My Estimates').click({force: true})


reviewObj.validateProjectOnMyEstimatesPage()

//estObj.clickViewIcon()
//estObj.validateReportSummary()
loginObj.clickLogout()

         });


it('TC-2: Create Project Validates and validate Created and downloaded PDF with actual saved data by skiping step 5',{ retries: 2 }, function() {

      //  Enter and SAVE Project Name
      cy.log("======= Entring Data in step 1 ======")
const projectName = faker.company.buzzAdjective()
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

reviewObj.validateStage()
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
//reviewObj.varifyProjectType()
reviewObj.verifyLocation()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()
//reviewObj.varifyUploadedFile1()

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(2000)


cy.contains('Home').click()
cy.wait(100)
cy.contains('My Estimates').click()


reviewObj.validateProjectOnMyEstimatesPage()

// 1. Resolve the alias FIRST
// 1. Load the fixture FIRST
  cy.fixture('loginData.json').then((user) => {
    
    // 2. Assign the email from fixture to your reportData object
    // Use CEmail or whatever key you need
    reportData.email = user.CEmail; 
    
    // ... logic for your test steps ...
// 1. Resolve the alias FIRST
cy.get('@savedProjectName').then((projectName) => {
    
    
    const sanitizedName = projectName.replace(/-/g, '_');
      const normalizePdfText = (text) =>
  text
    .replace(/\s+/g, " ")
    .replace(/[^\w\s:/.-]/g, "")
    .toLowerCase()
    .trim();


    const expectedFileName = buildPdfFileName(
        reportData.email,
        sanitizedName, 
        reportData.date
    );

// 1. Find the newest file dynamically and

// 1. Gather all your dynamic values from aliases

cy.get('@structureType').then((expectedStructure) => {
  cy.get('@roofPitch').then((expectedPitch) => {
    cy.get('@roofAge').then((expectedAge) => {
      cy.get('@layer').then((expectedMaterial) => {

        const downloadsFolder = "cypress/downloads";

        // 2. Find and Read the PDF
        cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {
          cy.task("readPdf", latestPath).then((extractedText) => {
            
            // Normalize PDF text to one long line of lowercase text
            const pdfContent = extractedText.replace(/\s+/g, ' ').toLowerCase();

            // 3. ACTUAL DATA VALIDATION
            // We verify that the VALUE we saved is present in the PDF
            
            cy.log(`Validating Actual Data: ${expectedStructure}, ${expectedPitch}, ${expectedAge}, ${expectedMaterial}`);

            // Validate Property Type Value
            expect(pdfContent, 'Structure Type Match').to.include(expectedStructure.toLowerCase().trim());

            // Validate Roof Style/Pitch Value
            expect(pdfContent, 'Roof Pitch Match').to.include(expectedPitch.toLowerCase().trim());

            // Validate Roof Age Value
            // We use String() to prevent "toString of undefined" errors
              //Age without 0
        const expectedAgeNum = String(Number(expectedAge));

           expect(pdfContent).to.include(expectedAgeNum);


            // Validate Material Value
            expect(pdfContent, 'Material Match').to.include(expectedMaterial.toLowerCase().trim());

            cy.log("✅ SUCCESS: The PDF contains the exact data stored during the test.");
          });
          // Delete after validation
      cy.task("deleteFile", filePath);
        });
      });
    });
  });

})
})
})
loginObj.clickLogout()
    
         });


   it.skip('TC# 3:Enter valid data in all steps for Homeowner and validate Created PDF file with correct input data ', ()=>{
     //  Enter and SAVE Project Name
      cy.log("======= Entring Data in step 1 ======")
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
    step1Obj.validateYourRoleForHomeowner()
  step1Obj.selectProjectType()
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
    cy.log("======= Uploading valid image ======")
 // locationObj.uploadValidImage()

 // locationObj.varifyUploadImage()


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

matObj.selectRandomFeltType()

cy.get('@feltType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random checkboxes each run time ======")
matObj.selectRandomCheckboxes()
cy.get('@selectedOptions').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()


//step 5 start
cy.log("======= Starting step 5, entring valid data ======")
roleObj.validateTitle()
roleObj.validateStage()
roleObj.enterName(faker.person.firstName())
roleObj.enterEmail(faker.internet.email())
roleObj.selectProjectUrgency()

roleObj.selectBudgetStyle()


roleObj.clickNextButton()

cy.log("======= Starting step 6: varifying entred data in all steps ======")

reviewObj.validateStage()
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
reviewObj.varifyProjectType()
reviewObj.verifyLocation()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()
//reviewObj.varifyUploadedFile1()

reviewObj.clickGenerateEstimateButton()
cy.wait(1000)

reviewObj.validatedProjectGenerated()
cy.wait(1000)
reviewObj.verifySucessMessage()
cy.wait(1000)
//reviewObj.verifySucessMessageForReport()

reviewObj.validateProjectOnMyEstimatesPage()



// 1. Load the fixture FIRST
  cy.fixture('loginData.json').then((user) => {
    
    // 2. Assign the email from fixture to your reportData object
    // Use CEmail or whatever key you need
    reportData.email = user.HEmail; 
    
    // ... logic for your test steps ...
// 1. Resolve the alias FIRST
cy.get('@savedProjectName').then((projectName) => {
    
    
    const sanitizedName = projectName.replace(/-/g, '_');
      const normalizePdfText = (text) =>
  text
    .replace(/\s+/g, " ")
    .replace(/[^\w\s:/.-]/g, "")
    .toLowerCase()
    .trim();


    const expectedFileName = buildPdfFileName(
        reportData.email,
        sanitizedName, 
        reportData.date
    );

    // 3. Define the path INSIDE this block
   
    cy.log(`Original Name: ${projectName} | Filename Name: ${sanitizedName}`);
    const filePath = `cypress/downloads/${expectedFileName}`;
    cy.log('Target PDF Path: ' + filePath);

   

    // 4. Perform the file check and PDF reading INSIDE this block
    cy.readFile(filePath, { timeout: 20000 }).should('exist');
    
     const downloadsFolder = "cypress/downloads";
     // 1. Gather all your dynamic values from aliases
cy.get('@city').then((city) => {
    cy.get('@country').then((country) => {
      const location = `${city}, ${country}`;
      cy.wrap(`${city}, ${country}`).as('location');


     // 1. Resolve each alias individually to avoid the Selector error

cy.get('@structureType').then((expectedStructure) => {
  cy.get('@roofPitch').then((expectedPitch) => {
    cy.get('@roofAge').then((expectedAge) => {
      cy.get('@layer').then((expectedMaterial) => {
        cy.get('@Name').then((expectedName) => {
         

                  const downloadsFolder = "cypress/downloads";

                  // 2. Read the PDF
                  cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {
                    cy.task("readPdf", latestPath).then((extractedText) => {
                      
                      const pdfContent = extractedText.replace(/\s+/g, ' ').toLowerCase();
                      // 3. ACTUAL DATA VALIDATION
            // We verify that the VALUE we saved is present in the PDF
            
            cy.log(`Validating Actual Data: ${expectedStructure}, ${expectedPitch}, ${expectedAge}, ${expectedMaterial}, ${expectedName}`);

           
           // Convert to String first to avoid the ".toLowerCase is not a function" error

expect(pdfContent, 'Name').to.include(expectedName);
            // Validate Property Type Value
            expect(pdfContent, 'Structure Type Match').to.include(expectedStructure.toLowerCase().trim());

            // Validate Roof Style/Pitch Value
            expect(pdfContent, 'Roof Pitch Match').to.include(expectedPitch.toLowerCase().trim());

            // Validate Roof Age Value
            // We use String() to prevent "toString of undefined" errors
            const ageStr = String(expectedAge || '').toLowerCase().trim();
            expect(pdfContent, 'Roof Age Match').to.include(ageStr);

            // Validate Material Value
            expect(pdfContent, 'Material Match').to.include(expectedMaterial.toLowerCase().trim());

            cy.log("✅ SUCCESS: The PDF contains the exact data stored during the test.");


            });
          });
        });
      });
    });
  });})
})
});
})
 })
loginObj.clickLogout()


})


//detected Location varification
it.skip('TC# 11 : Varify Detected location after clicking detected by location', ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     
      step1Obj.validateYourRoleForHomeowner()
  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')

  cy.log("======= Uploading valid image ======")
  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
  locationObj.validateLocationDetection();  //detected location

  locationObj.clickNextButton()


})

 // nagative TC

 it('TC# 12 : validate error message on invalid image file', { retries: 2 },()=>{
cy.log("======= Entering Data ======");

// 1. Project Name
const projectName = faker.company.buzzAdjective();
step1Obj.enterProjectName(projectName);
cy.wrap(projectName).as('savedProjectName');

// 2. Validate Role (With custom failure message)
step1Obj.validateYourRoleForHomeowner(); 
// Inside validateYourRoleForHomeowner, you should have:
// cy.get(roleSelector).should('contain', 'Homeowner').and('be.visible');

step1Obj.selectProjectType();
step1Obj.clickNextButton();

// 3. Step 2 Transitions
step1Obj.validateStep2(); 

// 4. Location Details
locationObj.enterCountry('USA');
locationObj.enterCity('Houston');
locationObj.enterZipCode('77001');

cy.log("======= Entering Data in step 2 ======");

// 5. Invalid Image Upload Validation
locationObj.uploadInvaidImageFile();

// --- CLEAR FAILURE MESSAGE LOGIC ---
// We assert that the error message for invalid upload appears
// Inside your test or Page Object
cy.log("======= Validating Invalid File Error =======");

// Check if the error message exists on the page
// Look at the page body to see if the error is there
cy.get('body').then($body => {

  const errorSelector = '.file-error-message';

  const errorExists = $body.find(errorSelector).length > 0;

  if (!errorExists) {
    throw new Error('No error message displayed for invalid file upload');
  }

  // If exists, validate it
  cy.get(errorSelector).should('be.visible');

});


})


 it('TC# 13 : validate error message on uploading file size more than 10MB', { retries: 2 },()=>{

cy.log("======= Entering Data ======");

// 1. Project Name
const projectName = faker.company.buzzAdjective();
step1Obj.enterProjectName(projectName);
cy.wrap(projectName).as('savedProjectName');

// 2. Validate Role (With custom failure message)
step1Obj.validateYourRoleForHomeowner(); 
// Inside validateYourRoleForHomeowner, you should have:
// cy.get(roleSelector).should('contain', 'Homeowner').and('be.visible');

//step1Obj.selectProjectType();
step1Obj.clickNextButton();

// 3. Step 2 Transitions
step1Obj.validateStep2(); 

// 4. Location Details
locationObj.enterCountry('USA');
locationObj.enterCity('Houston');
locationObj.enterZipCode('77001');

cy.log("======= Entering Data in step 2 ======");

// 5. Invalid Image Upload Validation

   locationObj.uploadInvaidImageSize()
   
  
 loginObj.clickLogout()

})



 it('TC# 14 : Validate error message should displayed on leaving Mandatory field Project name on step 1',{ retries: 2 }, ()=>{

      cy.log("======= Entring Data ======")
   
     
    step1Obj.clickNextButton()

    step1Obj.validateProjectName()


 
loginObj.clickLogout()
  
  })

 // email field with invalud email

 it.skip('TC# 15 : Validate steps dispalyed correct on step 1 page', ()=>{
    step1Obj.validateSteps()
    
 loginObj.clickLogout()  
      
    })

 it.skip('TC# 15 :validate correct form title displayed for step 1', ()=>{
    step1Obj.validateTitle()
    
 loginObj.clickLogout()

   })


 it.skip('TC# 16 : validate preview button is disable on step 1 ', ()=>{

    
    step1Obj.validatePreviousButton()
    
 loginObj.clickLogout()
   
 })


 it('TC# 17: validate image remove link is working ', ()=>{


cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')

      step1Obj.validateYourRoleForHomeowner()
            
 // step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')

   locationObj.vaidateImgRemoveLink()
  

// step 3

 loginObj.clickLogout()


})



 it.skip('TC# 18: validate uploading multiple images', ()=>{

cy.log("======= Entring Data in step 1 with step 5 with filling data  ======")
  
      //  Enter and SAVE Project Name
      cy.log("======= Entring Data in step 1 ======")
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
    step1Obj.validateYourRoleForHomeowner()
  step1Obj.selectProjectType()
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

  cy.log("======= Uploading valid image ======")

 // locationObj.vaidateUpoadMultipleImages() //image 1
 locationObj.uploadValidImage()

        

//  locationObj.varifyUploadImage()

  locationObj.clickNextButton()

// step 3 start

cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()


cy.get('@structureType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random  Roof Pitch ======")

roofObj.selectRandomRoofPitch()

cy.get('@roofPitch').then(val => {
  cy.log("Selected:", val);
});

cy.wait(500)
cy.log("======= Entring Random number ======")
roofObj.enterRoofAge(faker.string.numeric(2))


roofObj.ClickNextButton()
// step 4 start

cy.log("======= Entring Data in Step 4 ======")
matObj.validateStage()
matObj.validateTitle()
cy.log("======= Selecting random option from dropdown menu ======")
matObj.selectRandomMaterialSingle()

cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()


//step 5 start
cy.log("======= Starting step 5, entring valid data ======")



roleObj.clickNextButton()

/*
//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
reviewObj.varifyProjectType()
reviewObj.verifyLocation()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()
*/
// steps 7 click generate button

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

/*
reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(2000)

reviewObj.validateProjectOnMyEstimatesPage()


 loginObj.clickLogout()
*/
})
/*

 it('validate uploading image of 10 MB', ()=>{

 cy.log("======= Testing Login ======")
 cy.log("======= Open Web application ======")

 loginObj.openURL()
 
 cy.log("======= Clicking Profile icon ======")
 loginObj.clickProfileIcon()
// signupObj.enterFullName(signUpData.FName)
cy.log("======= Entring Data ======")

loginObj.enterValidEmail(loginData.HEmail);
loginObj.enterPassword(loginData.Hpassword);
loginObj.clickButton()
loginObj.validateHomewnerDashboard()

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     
     

      
  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2

//  locationObj.enterCountry(faker.location.country())
//  locationObj.enterCity(faker.location.city())
  locationObj.enterZipCode('12345')

     locationObj.vaidateUploadImage10MB()
    locationObj.validateMyLocation()
  locationObj.clickNextButton()

// step 3


loginObj.clickLogout()

})
*/


 it('TC# 19 : validate empty zipcode error', { retries: 2 },()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     
      
      step1Obj.validateYourRoleForHomeowner()
//  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
 // locationObj.enterZipCode('77001')

 locationObj.validateZipcodeError()

// step 3

 loginObj.clickLogout()
})



 it.skip('TC# 20: validate Previous Button', ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
  

      step1Obj.validateYourRoleForHomeowner()
  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')

 locationObj.clickNextButton()
 locationObj.varifyPreviousButton()

// step 3


 loginObj.clickLogout()
})

// enter invalid data in roof age on 3rd step
 
it('TC# 21: Enter invalid roof age', { retries: 2 },()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     
       
      step1Obj.validateYourRoleForHomeowner()
 // step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')

  locationObj.validateMyLocation()
  locationObj.clickNextButton()

// step 3 start

roofObj.selectRandomStructureType()
roofObj.selectRandomRoofPitch()

roofObj.enterInvaidRoofAge()
roofObj.ClickNextButton()


 loginObj.clickLogout()
})


it.skip('TC# 22: check preview button on step 3', ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   
      step1Obj.validateYourRoleForHomeowner()
 // step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')

  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
//  locationObj.validateMyLocation()
  locationObj.clickNextButton()

// step 3 start

roofObj.selectRandomStructureType()
roofObj.selectRandomRoofPitch()

roofObj.enterInvaidRoofAge()
roofObj.ClickPreButton()

locationObj.validateStep2()

 loginObj.clickLogout()

})

// multiple layes test

 it('TC# 23: Test by selecting multiple layes on material steps 4/6',{ retries: 2 }, ()=>{
   //  Enter and SAVE Project Name
      cy.log("======= Entring Data in step 1 ======")
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
    step1Obj.validateYourRoleForHomeowner()
//  step1Obj.selectProjectType()
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
  cy.log("======= Selecting random Roof Structure Type ======")
  roofObj.selectRandomStructureType()
  
  
  cy.get('@structureType').then(val => {
    cy.log("Selected:", val);
  });
  
  cy.log("======= Selecting random  Roof Pitch ======")
  
  roofObj.selectRandomRoofPitch()
  
  cy.get('@roofPitch').then(val => {
    cy.log("Selected:", val);
  });
  
  
  cy.log("======= Entring Random number ======")
  roofObj.enterRoofAge(faker.string.numeric(2))
  
  cy.get('@roofAge').then(val => {
    cy.log("Selected:", val);
  });
  
  roofObj.ClickNextButton()
  
  // step 4 start
  
  cy.log("======= Entring Data in Step 4 ======")
  matObj.validateStage()
  matObj.validateTitle()
  cy.log("======= Selecting random option from dropdown menu ======")
  matObj.selectRandomMaterialMultiple()
  
  
  cy.get('@layer1').then(val => {
    cy.log("Selected:", val);
  });

  cy.wait(200)
  cy.get('@layer2').then(val => {
    cy.log("Selected:", val);
  });
  
  
  
  matObj.clickNextButton()
  
  
  
  //step 5 start
  /*
  
  //step 5 start
  
  cy.log("======= Starting step 5, entring valid data ======")
  croleObj.validateTitleForCon()
  croleObj.validateStage()
  
  croleObj.selectRandomDropdowns()
  croleObj.selectRandomCheckboxes()
  
  */
roleObj.clickNextButton()
  
  
  //step 6 start
  cy.log("======= Starting step 6: varifying entred data in all steps ======")
  reviewObj.validateTitle()
  reviewObj.validateStage()
  reviewObj.varifyProjectName()
  reviewObj.varifyRole()
 // reviewObj.varifyProjectType()
  reviewObj.verifyLocation()
  reviewObj.varifyStructureType()
  reviewObj.varifyRoofPitch()
  reviewObj.varifyRoofAge()
  reviewObj.varifyMaterialLayer2()
  //reviewObj.varifyUploadedFile1()
  
  // steps 7 click generate button
  
  reviewObj.clickGenerateEstimateButton()
  cy.wait(2000)
  
  reviewObj.validatedProjectGenerated()
  cy.wait(2000)
  reviewObj.verifySucessMessage()
  cy.wait(2000)
  
  cy.contains('Home').click()
  cy.wait(100)
  cy.contains('My Estimates').click()
  
  
  reviewObj.validateProjectOnMyEstimatesPage()
  
  
  // 1. Load the fixture FIRST
    cy.fixture('loginData.json').then((user) => {
      
      // 2. Assign the email from fixture to your reportData object
      // Use CEmail or whatever key you need
      reportData.email = user.HEmail; 
      
      // ... logic for your test steps ...
  // 1. Resolve the alias FIRST
  cy.get('@savedProjectName').then((projectName) => {
      
      
      const sanitizedName = projectName.replace(/-/g, '_');
        const normalizePdfText = (text) =>
    text
      .replace(/\s+/g, " ")
      .replace(/[^\w\s:/.-]/g, "")
      .toLowerCase()
      .trim();
  
  
      const expectedFileName = buildPdfFileName(
          reportData.email,
          sanitizedName, 
          reportData.date
      );
  
      // 3. Define the path INSIDE this block
     
      cy.log(`Original Name: ${projectName} | Filename Name: ${sanitizedName}`);
      const filePath = `cypress/downloads/${expectedFileName}`;
      cy.log('Target PDF Path: ' + filePath);
  
     
  
      // 4. Perform the file check and PDF reading INSIDE this block
      cy.readFile(filePath, { timeout: 20000 }).should('exist');
      
       const downloadsFolder = "cypress/downloads";
   
  // 1. Find the newest file dynamically and
  
  // 1. Gather all your dynamic values from aliases
  cy.get('@city').then((city) => {
      cy.get('@country').then((country) => {
        const location = `${city}, ${country}`;
        cy.wrap(`${city}, ${country}`).as('location');
  
  
  cy.get('@structureType').then((expectedStructure) => {
    cy.get('@roofPitch').then((expectedPitch) => {
      cy.get('@roofAge').then((expectedAge) => {
        cy.get('@layer1').then((expectedMaterial1) => {
          cy.get('@layer2').then((expectedMaterial2) => {
  
            const expectedLocation = location;
  
          cy.get('@location').then((expectedLocation) => {
            
  
          const downloadsFolder = "cypress/downloads";
  
           
          // 2. Find and Read the PDF
          cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {
            cy.task("readPdf", latestPath).then((extractedText) => {
              
              // Normalize PDF text to one long line of lowercase text
              const pdfContent = extractedText.replace(/\s+/g, ' ').toLowerCase();
  
              // 3. ACTUAL DATA VALIDATION
              // We verify that the VALUE we saved is present in the PDF
              
              cy.log(`Validating Actual Data: ${expectedStructure}, ${expectedPitch}, ${expectedAge}, ${expectedMaterial1},${expectedMaterial2},${expectedLocation}`);
  
                // Validate Property Type Value
        //      expect(pdfContent, 'Project Address Match').to.include(expectedLocation.toLowerCase().trim());
  
              // Validate Property Type Value
              expect(pdfContent, 'Structure Type Match').to.include(expectedStructure.toLowerCase().trim());
  
              // Validate Roof Style/Pitch Value
              expect(pdfContent, 'Roof Pitch Match').to.include(expectedPitch.toLowerCase().trim());
  
              // Validate Roof Age Value
              // We use String() to prevent "toString of undefined" errors
              //Age without 0
          const expectedAgeNum = String(Number(expectedAge));
  
             expect(pdfContent).to.include(expectedAgeNum);
  
              // Validate Material Value
              expect(pdfContent, 'Material Match').to.include(expectedMaterial1.toLowerCase().trim());
               expect(pdfContent, 'Material Match').to.include(expectedMaterial2.toLowerCase().trim());
  
              cy.log("✅ SUCCESS: The PDF contains the exact data stored during the test.");
            });
          });
        });
      });
            
  })})})})})})
  
      })
    })
  

loginObj.clickLogout()

})


// test to remove selected layers
 it('TC# 24 : Test by selecting multiple layes remove on material steps 4/6',{ retries: 2 }, ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   
   
      step1Obj.validateYourRoleForHomeowner()
//  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')

  locationObj.clickNextButton()

// step 3 start

cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()


cy.get('@structureType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random  Roof Pitch ======")

roofObj.selectRandomRoofPitch()

cy.get('@roofPitch').then(val => {
  cy.log("Selected:", val);
});


cy.log("======= Entring Random number ======")
roofObj.enterRoofAge(faker.string.numeric(2))

cy.get('@roofAge').then(val => {
  cy.log("Selected:", val);
});

roofObj.ClickNextButton()
// step 4 start

cy.log("======= Entring Data in Step 4 ======")
matObj.validateStage()
cy.log("======= Selecting random option from dropdown menu ======")
matObj.selectRandomMaterialMultiple()

cy.get('@layer1').then(val => {
  cy.log("Selected:", val);
});


cy.get('@layer2').then(val => {
  cy.log("Selected:", val);
});


matObj.deleteAddedLayed()


loginObj.clickLogout()

})

// Test Material step without selecting any layer and validate error

 it('TC# 25 : Test layes withtout selecting laye on material steps 4/6', { retries: 2 },()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
         
  
      step1Obj.validateYourRoleForHomeowner()
//  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')


  locationObj.clickNextButton()

// step 3 start

cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()


cy.get('@structureType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random  Roof Pitch ======")

roofObj.selectRandomRoofPitch()

cy.get('@roofPitch').then(val => {
  cy.log("Selected:", val);
});


cy.log("======= Entring Random number ======")
roofObj.enterRoofAge(faker.string.numeric(2))

cy.get('@roofAge').then(val => {
  cy.log("Selected:", val);
});

roofObj.ClickNextButton()
// step 4 start

cy.log("======= Entring Data in Step 4 ======")
matObj.validateStage()
cy.log("======= Selecting random option from dropdown menu ======")

matObj.clickNextButton()
matObj.validateEmptyMaterailError()
 loginObj.clickLogout()

})

//test creating project wihtou selecting any felt type or checkboxes


 it('TC# 26: Test layes wihtout selecting felt type on material steps 4/6',{ retries: 2 }, ()=>{
cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
             
      
      step1Obj.validateYourRoleForHomeowner()
//  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')

  cy.log("======= Uploading valid image ======")

  locationObj.clickNextButton()

// step 3 start

cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()


cy.get('@structureType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random  Roof Pitch ======")

roofObj.selectRandomRoofPitch()

cy.get('@roofPitch').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Entring Random number ======")
roofObj.enterRoofAge(faker.string.numeric(2))

cy.get('@roofAge').then(val => {
  cy.log("Selected:", val);
});

roofObj.ClickNextButton()
// step 4 start

cy.log("======= Entring Data in Step 4 ======")
matObj.validateStage()
cy.log("======= Selecting random option from dropdown menu ======")

matObj.selectRandomMaterialSingle()

matObj.clickNextButton()



//step 5 start
cy.log("======= Starting step 5, entring valid data ======")
roleObj.validateTitle()
roleObj.validateStage()
roleObj.enterName(faker.person.firstName())
roleObj.enterEmail(faker.internet.email())

roleObj.selectProjectUrgency()

roleObj.selectBudgetStyle()

roleObj.clickNextButton()



//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
//reviewObj.varifyProjectType()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()


reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(2000)

cy.contains('Home').click({force: true})
cy.wait(100)
cy.contains('My Estimates').click({force: true})


reviewObj.validateProjectOnMyEstimatesPage()


loginObj.clickLogout()

})

// check previous button on step 4


 it.skip('TC# 27: Test previous button on material steps 4/6', ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
    
      
      step1Obj.validateYourRoleForHomeowner()
         
  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')


  locationObj.clickNextButton()

// step 3 start

cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()


cy.get('@structureType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random  Roof Pitch ======")

roofObj.selectRandomRoofPitch()

cy.get('@roofPitch').then(val => {
  cy.log("Selected:", val);
});


cy.log("======= Entring Random number ======")
roofObj.enterRoofAge(faker.string.numeric(2))

cy.get('@roofAge').then(val => {
  cy.log("Selected:", val);
});

roofObj.ClickNextButton()
// step 4 start

cy.log("======= Entring Data in Step 4 ======")
matObj.validateStage()
matObj.validateTitle()
cy.log("======= Selecting random option from dropdown menu ======")

matObj.clickPreButton()


 loginObj.clickLogout()

})


//check previous Button on step 5

it.skip('TC# 28: Check Previous Button on step 5/6', ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)
     
      
      step1Obj.validateYourRoleForHomeowner()
  step1Obj.selectProjectType()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 locationObj.enterCountry('USA')
 locationObj.enterCity('Houston')
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('77001')


  locationObj.clickNextButton()

// step 3 start
cy.wait(300)
cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()
cy.wait(300)

cy.get('@structureType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random  Roof Pitch ======")
cy.wait(300)
roofObj.selectRandomRoofPitch()

cy.get('@roofPitch').then(val => {
  cy.log("Selected:", val);
});

cy.wait(500)
cy.log("======= Entring Random number ======")
roofObj.enterRoofAge(faker.string.numeric(2))

cy.get('@roofAge').then(val => {
  cy.log("Selected:", val);
});

roofObj.ClickNextButton()
// step 4 start

cy.log("======= Entring Data in Step 4 ======")
matObj.validateStage()
matObj.validateTitle()
cy.log("======= Selecting random option from dropdown menu ======")
matObj.selectRandomMaterialSingle()

cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});

matObj.selectRandomFeltType()

cy.get('@feltType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random checkboxes each run time ======")
matObj.selectRandomCheckboxes()
cy.get('@selectedOptions').then(val => {
  cy.log("Selected:", val);
});

matObj.clickNextButton()


//step 5 start

roleObj.validateTitle()
roleObj.validateStage()
roleObj.enterName(faker.person.firstName())
roleObj.enterEmail(faker.internet.email())
roleObj.selectProjectUrgency()

//roleObj.selectBudgerStyle()

roleObj.selectLanguage()

roleObj.selectCurrency()

roleObj.clickPreButton()
matObj.validateStage()



 loginObj.clickLogout()

})



// validate error on step 5 by entring invalid email

it('TC# 29: Check invalid email on step 5/6', { retries: 2 },()=>{

 //  Enter and SAVE Project Name
      cy.log("======= Entring Data in step 1 ======")
const projectName = faker.company.buzzAdjective()
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
    cy.log("======= Uploading valid image ======")
 // locationObj.uploadValidImage()

 // locationObj.varifyUploadImage()


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

matObj.selectRandomFeltType()

cy.get('@feltType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random checkboxes each run time ======")
matObj.selectRandomCheckboxes()
cy.get('@selectedOptions').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()


//step 5 start
cy.log("======= Starting step 5, entring valid data ======")
roleObj.validateTitle()
roleObj.validateStage()
roleObj.enterName(faker.person.firstName())
roleObj.enterEmail('test')


roleObj.clickNextButton()
roleObj.validateInvalidEmail()
roleObj.validateStage()



 loginObj.clickLogout()

})

// preview button check on 6 step

it.skip('TC# 30: Check Preview button on 6 step', ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
       cy.wait(500)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(500)
     

 
      step1Obj.validateYourRoleForHomeowner()
  step1Obj.selectProjectType()
    cy.wait(500)
  step1Obj.clickNextButton()
    cy.wait(500)
  step1Obj.validateStep2()
    cy.wait(500)

  // start step 2
 locationObj.enterCountry('USA')
   cy.wait(500)
 locationObj.enterCity('Houston')
   cy.wait(500)
cy.log("======= Entring Data in step 2 ======")
  cy.wait(500)
  locationObj.enterZipCode('77001')
    cy.wait(500)
  
  
 // locationObj.detectAndValidateLocation();
  locationObj.clickNextButton()

// step 3 start
  cy.wait(500)
cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()
  cy.wait(500)

cy.get('@structureType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random  Roof Pitch ======")
  cy.wait(500)
roofObj.selectRandomRoofPitch()

cy.get('@roofPitch').then(val => {
  cy.log("Selected:", val);
});

cy.wait(500)
cy.log("======= Entring Random number ======")
roofObj.enterRoofAge(faker.string.numeric(2))


roofObj.ClickNextButton()
// step 4 start
  cy.wait(500)
cy.log("======= Entring Data in Step 4 ======")
matObj.validateStage()
  cy.wait(500)
matObj.validateTitle()
  cy.wait(500)
cy.log("======= Selecting random option from dropdown menu ======")
matObj.selectRandomMaterialSingle()


cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});

matObj.selectRandomFeltType()

cy.get('@feltType').then(val => {
  cy.log("Selected:", val);
});

cy.log("======= Selecting random checkboxes each run time ======")
matObj.selectRandomCheckboxes()
cy.get('@selectedOptions').then(val => {
  cy.log("Selected:", val);
});

matObj.clickNextButton()


//step 5 start
cy.log("======= Starting step 5, entring valid data ======")
roleObj.validateTitle()
roleObj.validateStage()
roleObj.enterName(faker.person.firstName())
roleObj.enterEmail(faker.internet.email())
roleObj.selectProjectUrgency()
cy.wait(300)
roleObj.selectBudgetStyle()

roleObj.clickNextButton()
cy.wait(300)

//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.clickPreButton()
roleObj.validateStage()

 loginObj.clickLogout()

})


 
//language test Spnaish
 
    const portugueseGreeting = 'obrigado';

  it('TC# 6: Validate PDF Portuguese Language', { retries: 2 },() => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
    step1Obj.validateYourRoleForHomeowner();
  //  step1Obj.selectProjectType();
    step1Obj.clickNextButton();

    /* =========================
       STEP 2 – LOCATION
    ========================== */

    locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');

    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');

    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

    locationObj.clickNextButton();

    /* =========================
       STEP 3 – ROOF
    ========================== */

    roofObj.selectRandomStructureType(); // must alias @structureType
    roofObj.selectRandomRoofPitch();     // must alias @roofPitch

    const roofAge = faker.string.numeric(2);
    cy.wrap(roofAge).as('roofAge');
    roofObj.enterRoofAge(roofAge);

    roofObj.ClickNextButton();

    /* =========================
       STEP 4 – MATERIAL
    ========================== */

    matObj.selectRandomMaterialSingle(); // alias @layer
    //matObj.selectRandomFeltType();
    //matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('button[role="combobox"]').eq(2).click({ force: true });
    cy.contains('[role="option"]', 'Portuguese').click({ force: true });

    

   // roleObj.selectCurrency();
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
//reviewObj.varifyProjectType();
    reviewObj.verifyLocation();
    reviewObj.varifyStructureType();
    reviewObj.varifyRoofPitch();
    reviewObj.varifyRoofAge();
    reviewObj.varifyMaterialLayer1();
reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(2000)

cy.contains('Home').click({force: true})
cy.wait(100)
cy.contains('My Estimates').click({force: true})


reviewObj.validateProjectOnMyEstimatesPage()

     
       /* ======================
       VALIDATE PDF LANGUAGE
       ====================== */
    cy.task('getLatestPdf', 'cypress/downloads').then(pdfPath => {

      cy.task('readPdf', pdfPath).then(pdfText => {

        expect(
          pdfText.toLowerCase(),
          'PDF should contain portuguese greeting'
        ).to.include(portugueseGreeting);

      });
    })
    loginObj.clickLogout();
  });



   // Stable greeting used only to detect Itali language
  const italianGreeting = 'cara';

  it('TC# 7: Validate PDF italian Language', { retries: 2 },() => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
    step1Obj.validateYourRoleForHomeowner();
   // step1Obj.selectProjectType();
    step1Obj.clickNextButton();

    /* =========================
       STEP 2 – LOCATION
    ========================== */

    locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');

    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');

    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

    locationObj.clickNextButton();

    /* =========================
       STEP 3 – ROOF
    ========================== */

    roofObj.selectRandomStructureType(); // must alias @structureType
    roofObj.selectRandomRoofPitch();     // must alias @roofPitch

    const roofAge = faker.string.numeric(2);
    cy.wrap(roofAge).as('roofAge');
    roofObj.enterRoofAge(roofAge);

    roofObj.ClickNextButton();

    /* =========================
       STEP 4 – MATERIAL
    ========================== */

    matObj.selectRandomMaterialSingle(); // alias @layer
   // matObj.selectRandomFeltType();
   // matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('button[role="combobox"]').eq(2).click({ force: true });
    cy.contains('[role="option"]', 'Italian').click({ force: true });

    

   // roleObj.selectCurrency();
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
  //  reviewObj.varifyProjectType();
    reviewObj.verifyLocation();
    reviewObj.varifyStructureType();
    reviewObj.varifyRoofPitch();
    reviewObj.varifyRoofAge();
    reviewObj.varifyMaterialLayer1();

 reviewObj.clickGenerateEstimateButton();
    cy.wait(2000)
    reviewObj.validatedProjectGenerated();
    cy.wait(2000)
    reviewObj.verifySucessMessage();
    cy.wait(2000)

     
       /* ======================
       VALIDATE PDF LANGUAGE
       ====================== */
    cy.task('getLatestPdf', 'cypress/downloads').then(pdfPath => {

      cy.task('readPdf', pdfPath).then(pdfText => {

        expect(
          pdfText.toLowerCase(),
          'PDF should contain italian greeting'
        ).to.include(italianGreeting);

      });
    })
    loginObj.clickLogout();
  });



    // Stable greeting used only to detect french language
  const frenchGreeting = 'chère';

  it('TC# 8: Validate PDF french Language', { retries: 2 },() => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
    step1Obj.validateYourRoleForHomeowner();
   // step1Obj.selectProjectType();
    step1Obj.clickNextButton();

    /* =========================
       STEP 2 – LOCATION
    ========================== */

    locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');

    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');

    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

    locationObj.clickNextButton();

    /* =========================
       STEP 3 – ROOF
    ========================== */

    roofObj.selectRandomStructureType(); // must alias @structureType
    roofObj.selectRandomRoofPitch();     // must alias @roofPitch

    const roofAge = faker.string.numeric(2);
    cy.wrap(roofAge).as('roofAge');
    roofObj.enterRoofAge(roofAge);

    roofObj.ClickNextButton();

    /* =========================
       STEP 4 – MATERIAL
    ========================== */

    matObj.selectRandomMaterialSingle(); // alias @layer
    //matObj.selectRandomFeltType();
   // matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('button[role="combobox"]').eq(2).click({ force: true });
    cy.contains('[role="option"]', 'French').click({ force: true });

    

    //roleObj.selectCurrency();
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
   // reviewObj.varifyProjectType();
    reviewObj.verifyLocation();
    reviewObj.varifyStructureType();
    reviewObj.varifyRoofPitch();
    reviewObj.varifyRoofAge();
    reviewObj.varifyMaterialLayer1();

 reviewObj.clickGenerateEstimateButton();
    cy.wait(2000)
    reviewObj.validatedProjectGenerated();
    cy.wait(2000)
    reviewObj.verifySucessMessage();
    cy.wait(2000)
     
       /* ======================
       VALIDATE PDF LANGUAGE
       ====================== */
    cy.task('getLatestPdf', 'cypress/downloads').then(pdfPath => {

      cy.task('readPdf', pdfPath).then(pdfText => {

        expect(
          pdfText.toLowerCase(),
          'PDF should contain french greeting'
        ).to.include(frenchGreeting);

      });
    })
    loginObj.clickLogout();
  });



  // Stable greeting used only to detect Spanish language
  const spanishGreeting = 'estimado';

  it('TC# 9: Validate PDF Spanish Language',{ retries: 2 }, () => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
    step1Obj.validateYourRoleForHomeowner();
   // step1Obj.selectProjectType();
    step1Obj.clickNextButton();

    /* =========================
       STEP 2 – LOCATION
    ========================== */

    locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');

    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');

    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

    locationObj.clickNextButton();

    /* =========================
       STEP 3 – ROOF
    ========================== */

    roofObj.selectRandomStructureType(); // must alias @structureType
    roofObj.selectRandomRoofPitch();     // must alias @roofPitch

    const roofAge = faker.string.numeric(2);
    cy.wrap(roofAge).as('roofAge');
    roofObj.enterRoofAge(roofAge);

    roofObj.ClickNextButton();

    /* =========================
       STEP 4 – MATERIAL
    ========================== */

    matObj.selectRandomMaterialSingle(); // alias @layer
   // matObj.selectRandomFeltType();
   // matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('button[role="combobox"]').eq(2).click({ force: true });
    cy.contains('[role="option"]', 'Spanish').click({ force: true });

    

   // roleObj.selectCurrency();
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
   // reviewObj.varifyProjectType();
    reviewObj.verifyLocation();
    reviewObj.varifyStructureType();
    reviewObj.varifyRoofPitch();
    reviewObj.varifyRoofAge();
    reviewObj.varifyMaterialLayer1();

    reviewObj.clickGenerateEstimateButton();
    cy.wait(2000)
    reviewObj.validatedProjectGenerated();
    cy.wait(2000)
    reviewObj.verifySucessMessage();
    cy.wait(2000)

 /* ======================
       VALIDATE PDF LANGUAGE
       ====================== */
    cy.task('getLatestPdf', 'cypress/downloads').then(pdfPath => {

      cy.task('readPdf', pdfPath).then(pdfText => {

        expect(
          pdfText.toLowerCase(),
          'PDF should contain Spnish greeting'
        ).to.include(spanishGreeting);

      });
    })
        loginObj.clickLogout();
  });


  // Stable greeting used only to detect German language
  const germanGreeting = 'liebe';

  it('TC# 10: Validate PDF German Language', { retries: 2 },() => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
    step1Obj.validateYourRoleForHomeowner();
    //step1Obj.selectProjectType();
    step1Obj.clickNextButton();

    /* =========================
       STEP 2 – LOCATION
    ========================== */

    locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');

    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');

    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

    locationObj.clickNextButton();

    /* =========================
       STEP 3 – ROOF
    ========================== */

    roofObj.selectRandomStructureType(); // must alias @structureType
    roofObj.selectRandomRoofPitch();     // must alias @roofPitch

    const roofAge = faker.string.numeric(2);
    cy.wrap(roofAge).as('roofAge');
    roofObj.enterRoofAge(roofAge);

    roofObj.ClickNextButton();

    /* =========================
       STEP 4 – MATERIAL
    ========================== */

    matObj.selectRandomMaterialSingle(); // alias @layer
   // matObj.selectRandomFeltType();
   // matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('button[role="combobox"]').eq(2).click({ force: true });
    cy.contains('[role="option"]', 'German').click({ force: true });

    

   // roleObj.selectCurrency();
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
   // reviewObj.varifyProjectType();
    reviewObj.verifyLocation();
    reviewObj.varifyStructureType();
    reviewObj.varifyRoofPitch();
    reviewObj.varifyRoofAge();
    reviewObj.varifyMaterialLayer1();

 reviewObj.clickGenerateEstimateButton();
    cy.wait(2000)
    reviewObj.validatedProjectGenerated();
    cy.wait(2000)
    reviewObj.verifySucessMessage();
    cy.wait(2000)
    reviewObj.validateProjectOnMyEstimatesPage()

       /* ======================
       VALIDATE PDF LANGUAGE
       ====================== */
    cy.task('getLatestPdf', 'cypress/downloads').then(pdfPath => {

      cy.task('readPdf', pdfPath).then(pdfText => {

        expect(
          pdfText.toLowerCase(),
          'PDF should contain German greeting'
        ).to.include(germanGreeting);

      });
    })
    loginObj.clickLogout();
  });

  
    const japaneseGreeting = '親愛なる';

  it('TC#4: Validate PDF japanese Language', () => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
    step1Obj.validateYourRoleForHomeowner();
    //step1Obj.selectProjectType();
    step1Obj.clickNextButton();

    /* =========================
       STEP 2 – LOCATION
    ========================== */

    locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');

    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');

    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

    locationObj.clickNextButton();

    /* =========================
       STEP 3 – ROOF
    ========================== */

    roofObj.selectRandomStructureType(); // must alias @structureType
    roofObj.selectRandomRoofPitch();     // must alias @roofPitch

    const roofAge = faker.string.numeric(2);
    cy.wrap(roofAge).as('roofAge');
    roofObj.enterRoofAge(roofAge);

    roofObj.ClickNextButton();

    /* =========================
       STEP 4 – MATERIAL
    ========================== */

    matObj.selectRandomMaterialSingle(); // alias @layer
    //matObj.selectRandomFeltType();
    //matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('button[role="combobox"]').eq(2).click({ force: true });
    cy.contains('[role="option"]', 'Japanese').click({ force: true });

    

   // roleObj.selectCurrency();
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
   // reviewObj.varifyProjectType();
    reviewObj.verifyLocation();
    reviewObj.varifyStructureType();
    reviewObj.varifyRoofPitch();
    reviewObj.varifyRoofAge();
    reviewObj.varifyMaterialLayer1();

 reviewObj.clickGenerateEstimateButton();
    cy.wait(2000)
    reviewObj.validatedProjectGenerated();
    cy.wait(2000)
    reviewObj.verifySucessMessage();
    cy.wait(2000)

       /* ======================
       VALIDATE PDF LANGUAGE
       ====================== */
    cy.task('getLatestPdf', 'cypress/downloads').then(pdfPath => {

      cy.task('readPdf', pdfPath).then(pdfText => {

        expect(
          pdfText.toLowerCase(),
          'PDF should contain japanese greeting'
        ).to.include(japaneseGreeting);

      });
    })
    loginObj.clickLogout();
  });


  
    const chineseGreeting = '亲爱的';

  it('TC# 5: Validate PDF chinese Language', () => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
    step1Obj.validateYourRoleForHomeowner();
  //  step1Obj.selectProjectType();
    step1Obj.clickNextButton();

    /* =========================
       STEP 2 – LOCATION
    ========================== */

    locationObj.enterCountry('USA');
    cy.wrap('USA').as('country');

    locationObj.enterCity('Houston');
    cy.wrap('Houston').as('city');

    locationObj.enterZipCode('77001');
    cy.wrap('77001').as('zipCode');

    locationObj.clickNextButton();

    /* =========================
       STEP 3 – ROOF
    ========================== */

    roofObj.selectRandomStructureType(); // must alias @structureType
    roofObj.selectRandomRoofPitch();     // must alias @roofPitch

    const roofAge = faker.string.numeric(2);
    cy.wrap(roofAge).as('roofAge');
    roofObj.enterRoofAge(roofAge);

    roofObj.ClickNextButton();

    /* =========================
       STEP 4 – MATERIAL
    ========================== */

    matObj.selectRandomMaterialSingle(); // alias @layer
   // matObj.selectRandomFeltType();
   // matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('button[role="combobox"]').eq(2).click({ force: true });
    cy.contains('[role="option"]', 'Chinese').click({ force: true });

    

  //  roleObj.selectCurrency();
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
  //  reviewObj.varifyProjectType();
    reviewObj.verifyLocation();
    reviewObj.varifyStructureType();
    reviewObj.varifyRoofPitch();
    reviewObj.varifyRoofAge();
    reviewObj.varifyMaterialLayer1();

 reviewObj.clickGenerateEstimateButton();
    cy.wait(2000)
    reviewObj.validatedProjectGenerated();
    cy.wait(2000)
    reviewObj.verifySucessMessage();
    cy.wait(2000)

       /* ======================
       VALIDATE PDF LANGUAGE
       ====================== */
    cy.task('getLatestPdf', 'cypress/downloads').then(pdfPath => {

      cy.task('readPdf', pdfPath).then(pdfText => {

        expect(
          pdfText.toLowerCase(),
          'PDF should contain chinese greeting'
        ).to.include(chineseGreeting);

      });
    })
    loginObj.clickLogout();
  });



})
