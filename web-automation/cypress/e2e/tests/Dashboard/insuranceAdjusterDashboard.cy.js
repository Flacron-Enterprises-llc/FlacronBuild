import roleProject from '../../../pages/role&Project'
import login from '../../../pages/login'
import location from '../../../pages/location'
import roofDetails from '../../../pages/roofDetails'
import materials from '../../../pages/materials'
import insurance from '../../../pages/insuranceAdjusterRole'
import review from '../../../pages/review'
import role from '../../../pages/role'
import inspectorRole from '../../../pages/inspectorRole'
import contractorRole from '../../../pages/contractorRole'
import { slowCypressDown } from 'cypress-slow-down'
//for PDF report validation
import { reportData } from '../../../support/reportDataStore'
import { buildPdfFileName } from '../../../support/pdfHelper'; //for geting project name


import {faker} from '@faker-js/faker'  //faker for fack data for testing

// object for each impored class 
const step1Obj = new roleProject()
const loginObj = new login()
const locationObj = new location()
const roofObj = new roofDetails()
const matObj = new materials()
const roleObj = new role()
const iroleObj2 = new inspectorRole()
const croleObj = new contractorRole()


const iroleObj = new insurance() //for step 5
const reviewObj = new review()
// import all data json file from fixtures folder
import loginData from '../../../fixtures/loginData.json' //import data file

describe('Enter and validate data for Insurance Adjuster Project' ,()=>{

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
               loginObj.enterValidEmail(loginData.DEmail);
               loginObj.enterPassword(loginData.Dpassword);
               loginObj.clickButton();
           } 
           
           // SCENARIO 2: Already Logged In (Profile menu exists)
           else if (isProfileMenuVisible) {
               cy.log('👉 Scenario 2: Already Logged In - Resetting via Logout');
               loginObj.clickLogout(); 
               cy.reload(); // Force a fresh state
               loginObj.clickProfileIcon();
               cy.get('input[placeholder="Email"]', { timeout: 10000 }).should('be.visible').type(loginData.DEmail);
               loginObj.enterPassword(loginData.Dpassword);
               loginObj.clickButton();
           } 
           
           // SCENARIO 3: Landing Page (Fallback)
           else if (isLandingPageVisible) {
               cy.log('👉 Scenario 3: On Landing Page - Clicking Profile');
               loginObj.clickProfileIcon(); 
               
               // Wait for React to render the modal/form
               cy.get('input[placeholder="Email"]', { timeout: 15000 })
                   .should('be.visible')
                   .type(loginData.DEmail);
           
               loginObj.enterPassword(loginData.Dpassword);
               loginObj.clickButton();
           }
       });
               
       })

 slowCypressDown(200) 
 

   it('TC-1: Enter valid data in all steps for Insurance Adjuster and validate PDF report ',{ retries: 2 }, ()=>{

cy.log("======= Entring Data in step 1 with step 5 with filling data  ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   
      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');
  
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
matObj.selectRandomMaterialSingle()

cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()


//step 5 start
iroleObj.validateTitle()
iroleObj.fillInsuranceStage5()
iroleObj.clickNextButton()

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

// steps 7 click generate button

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()



// 1. Load the fixture FIRST
  cy.fixture('loginData.json').then((user) => {
    
    // 2. Assign the email from fixture to your reportData object
    // Use CEmail or whatever key you need
    reportData.email = user.DEmail; 
    
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
      cy.get('@layer').then((expectedMaterial) => {
          const expectedLocation = location;

        cy.get('@location').then((expectedLocation) => {
           cy.get('@claimNumber').then((expectedClaimNumber) => {
             cy.get('@policyHolder').then((expectedPolicyholder) => {
              cy.get('@adjusterName').then((expectedAdjusterName) => {
                cy.get('@adjusterContact').then((expectedAdjusterContact) => {
                    cy.get('@primaryDamageCause').then((expectedPrimaryDamageCause) => {
                                   
               

        const downloadsFolder = "cypress/downloads";

         
        // 2. Find and Read the PDF
        cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {
          cy.task("readPdf", latestPath).then((extractedText) => {
            
            // Normalize PDF text to one long line of lowercase text
            const pdfContent = extractedText.replace(/\s+/g, ' ').toLowerCase();

            // 3. ACTUAL DATA VALIDATION
            // We verify that the VALUE we saved is present in the PDF
            
            cy.log(`Validating Actual Data: ${expectedPrimaryDamageCause},${expectedAdjusterContact},${expectedAdjusterName},${expectedStructure}, ${expectedClaimNumber},${expectedPolicyholder},${expectedPitch}, ${expectedAge}, ${expectedMaterial},${expectedLocation}`);

            // Name Value
            expect(pdfContent, 'Name Match').to.include(expectedClaimNumber.toLowerCase().trim());
             expect(pdfContent, 'AdjusterContact Match').to.include(expectedAdjusterContact.toLowerCase().trim());
           

            // Date Value
           // expect(pdfContent, 'Date Match').to.include(expectedDate);


            expect(pdfContent, 'Policy Holder Match').to.include(expectedPolicyholder.toLowerCase());

            expect(pdfContent, 'Adjuster Name Match').to.include(expectedAdjusterName.toLowerCase());


              // Location Value
            expect(pdfContent, 'Project Address Match').to.include(expectedLocation.toLowerCase().trim());

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
        });
      
                       
                      })
                    })
                                            

})})})})})})
})
    })
  })
})

    })
  })

loginObj.clickLogout()

})

// Scenario 2: Future Date Validation on stage 5 for loss date

   it('TC-2: Enter valid data in all steps for Insurance Adjuster with Future date in Loss date ', { retries: 2 }, ()=>{
cy.log("======= Entring Data in step 1 with step 5 with filling data  ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   
      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');
  
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
matObj.selectRandomMaterialSingle()

cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()


//step 5 start
iroleObj.fillInsuranceStage5WithFutureLossDate()

iroleObj.clickNextButton()
cy.contains('Date of loss cannot be in the future').should('exist')

loginObj.clickLogout()
})

//validate invalid data  fieldin steps 5

it('TC-3: Enter valid data in all steps for Insurance Adjuster with invalid data in contact number ,name,placeholder,id ',  { retries: 2 },()=>{

cy.log("======= Entring Data in step 1 with step 5 adding slope ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');
  
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
matObj.selectRandomMaterialSingle()

cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()


//step 5 start
iroleObj.fillInsuranceStage5WithInvalidData()

iroleObj.clickNextButton()
cy.contains('Enter Valid data in all fields').should('exist')


//step 6 start


// steps 7 click generate button

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


//detected Location varification
it.skip('Varify Detected location after clicking detected by location',  { retries: 2 },()=>{

cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
 

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


  // start step 2

// locationObj.enterCountry(faker.location.country())
// locationObj.enterCity(faker.location.city())
cy.log("======= Entring Data in step 2 ======")
 // locationObj.enterZipCode('12345')

  cy.log("======= Uploading valid image ======")
  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
  locationObj.validateMyLocation() //click detection 
   locationObj.validateMyLocation()
    locationObj.validateMyLocation()
 
  locationObj.validateLocationDetection();  //detected location
  locationObj.clickNextButton()

})

 // nagative TC

 it('TC-4: validate error message on invalid image file', { retries: 2 }, ()=>{

cy.log("======= Entring Data ======")

 //  Test Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');
  
    locationObj.uploadInvaidImageFile()
  locationObj.clickNextButton()

// step 3
 
loginObj.clickLogout()

})


 it('TC-5: validate error message on uploading file size more than 10MB',  { retries: 2 },()=>{


cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
  

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');

   locationObj.uploadInvaidImageSize()
   
  locationObj.clickNextButton()

 
loginObj.clickLogout()

})



 it('TC-6: Validate error message should displayed on leaving Mandatory field Project name on step 1', { retries: 2 }, ()=>{

       
      cy.log("======= Entring Data ======")

     
    step1Obj.clickNextButton()
    
  //  step1Obj.validateProjectNameForCon()
cy.contains('Project name is required').should("be.visible")

 
loginObj.clickLogout()
  
  })

 // email field with invalud email

 it.skip('Validate steps dispalyed correct on step 1 page', ()=>{
    step1Obj.validateSteps()
    
loginObj.clickLogout()  
      
    })

 it.skip('validate correct form title displayed for step 1', ()=>{
    step1Obj.validateTitle()
    
loginObj.clickLogout()

   })


 it.skip('validate preview button is disable on step 1 ', ()=>{

    
    step1Obj.validatePreviousButton()
    
loginObj.clickLogout()
   
 })



 it('TC-7: validate image remove link is working ',  { retries: 2 },()=>{


 //  Test Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
 

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


   // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');

   locationObj.vaidateImgRemoveLink()
  

// step 3

loginObj.clickLogout()


})



 it.skip('validate uploading multiple images', ()=>{

 
 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
cy.wait(300)
  locationObj.enterCountry(faker.location.country())
 locationObj.enterCity(faker.location.city())
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('12345')

  cy.log("======= Uploading valid image ======")

  locationObj.vaidateUpoadMultipleImages() //image 1

//  locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
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

iroleObj.clickNextButton()

cy.wait(300)


//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
reviewObj.varifyProjectType()
reviewObj.varifyLocation()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()
reviewObj.varifyUploadedFile2()


reviewObj.clickGenerateEstimateButton()
cy.wait(300)
 
reviewObj.validatedProjectGenerated()
cy.wait(300)
reviewObj.validateProjectOnComparePage()
    cy.wait(300)
reviewObj.validateProjectOnMyEstimatesPage()

loginObj.clickLogout()

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


 it('TC-8: validate empty zipcode error', { retries: 2 }, ()=>{

 //   Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
    

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2

 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');


 locationObj.validateZipcodeError()

// step 3

loginObj.clickLogout()
})



 it.skip('validate Previous Button on step 3', ()=>{

cy.log("======= Entring Data ======")

 //   Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2

  locationObj.enterCountry(faker.location.country())

 locationObj.clickNextButton()
 locationObj.varifyPreviousButton()

// step 3


loginObj.clickLogout()
})

// enter invalid data in roof age on 3rd step
 
it('TC-9: Enter invalid roof age', { retries: 2 }, ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
  

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2
 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');

  
  locationObj.clickNextButton()

// step 3 start

roofObj.selectRandomStructureType()
roofObj.selectRandomRoofPitch()

roofObj.enterInvaidRoofAge()
roofObj.ClickNextButton()


loginObj.clickLogout()
})


it.skip('check preview button on step 3', ()=>{

cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


  // start step 2

 locationObj.enterCountry(faker.location.country())
  locationObj.enterCity(faker.location.city())
  locationObj.enterZipCode('12345')

  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
  locationObj.clickNextButton()

// step 3 start

roofObj.selectRandomStructureType()
roofObj.selectRandomRoofPitch()
cy.wait(500)
roofObj.enterInvaidRoofAge()
roofObj.ClickPreButton()

locationObj.validateStep2()

loginObj.clickLogout()

})

// multiple layes test

 it('TC-10: Test by selecting multiple layes on material steps 4/6',  { retries: 2 },()=>{


cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
 

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


  // start step 2


        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');
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
matObj.selectRandomMaterialMultiple()


cy.get('@layer1').then(val => {
  cy.log("Selected:", val);
});
cy.get('@layer2').then(val => {
  cy.log("Selected:", val);
});




matObj.clickNextButton()



//step 5 start

cy.log("======= Starting step 5, entring valid data ======")
iroleObj.validateTitle()

iroleObj.validateStage()

iroleObj.clickNextButton()


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
reviewObj.varifyMaterialLayer2()

// steps 7 click generate button

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()


loginObj.clickLogout()

})


// test to remove selected layers
 it('TC-11: Test by selecting multiple layes remove on material steps 4/6',  { retries: 2 },()=>{

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');

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


matObj.selectRandomFeltType()



matObj.deleteAddedLayed()

matObj.clickNextButton()


loginObj.clickLogout()

})

// Test Material step without selecting any layer and validate error

 it('TC-12: Test layes wihtout selecting laye on material steps 4/6',  { retries: 2 },()=>{

 //   Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
    

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');
  

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

//test creating project without selecting any felt type or checkboxes

 it('TC-13: Test layes wihtout selecting felt type on material steps 4/6', { retries: 2 }, ()=>{
cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  // start step 2

 locationObj.enterCountry(faker.location.country())
   locationObj.enterCity(faker.location.city())
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('12345')

  cy.log("======= Uploading valid image ======")
 // locationObj.uploadValidImage()

 // locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
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


iroleObj.clickNextButton()
//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
reviewObj.varifyProjectType()

reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()

// steps 7 click generate button

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()


loginObj.clickLogout()

})

// check previous button on step 4

 it.skip('Test previous button on material steps 4/6', ()=>{

cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


  // start step 2
cy.wait(300)
 locationObj.enterCountry(faker.location.country())
 locationObj.enterCity(faker.location.city())
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('12345')

  cy.log("======= Uploading valid image ======")
  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
  locationObj.clickNextButton()

// step 3 start
cy.wait(600)
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

cy.wait(200)
matObj.clickPreButton()
cy.wait(200)

loginObj.clickLogout()

})


//check previous Button on step 5

it.skip('Check Previous Button on step 5/6', ()=>{

cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


  // start step 2
cy.wait(300)
 locationObj.enterCountry(faker.location.country())
  locationObj.enterCity(faker.location.city())
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('12345')

  cy.log("======= Uploading valid image ======")
  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
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

cy.log("======= Starting step 5, entring valid data ======")
iroleObj.validateTitle()
iroleObj.validateStage()

iroleObj.clickPreButton()
matObj.validateStage()
cy.wait(300)


loginObj.clickLogout()

})


it.skip('Create project skiping step 5', ()=>{

cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


  // start step 2
cy.wait(300)
 locationObj.enterCountry(faker.location.country())
  locationObj.enterCity(faker.location.city())
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('12345')

  cy.log("======= Uploading valid image ======")
  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
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



matObj.clickNextButton()



//step 5 start

cy.log("======= Starting step 5, entring valid data ======")
iroleObj.validateTitle()
iroleObj.validateStage()

iroleObj.clickNextButton()
reviewObj.validateStage()


//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.varifyProjectName()
reviewObj.varifyRole()
reviewObj.varifyProjectType()
reviewObj.varifyLocation()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()
reviewObj.varifyUploadedFile1()



reviewObj.clickGenerateEstimateButton()
cy.wait(300)
 
reviewObj.validatedProjectGenerated()
cy.wait(300)
reviewObj.validateProjectOnComparePage()
    cy.wait(500)
reviewObj.validateProjectOnMyEstimatesPage()


loginObj.clickLogout()
})



// preview button check on 6 step

it.skip('Check Preview button on 6 step', ()=>{

cy.log("======= Entring Data ======")

 //  E Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
     cy.wait(300)

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()


  // start step 2
cy.wait(300)
  locationObj.enterCountry(faker.location.country())
  locationObj.enterCity(faker.location.city())
cy.log("======= Entring Data in step 2 ======")
  locationObj.enterZipCode('12345')

  cy.log("======= Uploading valid image ======")
  locationObj.uploadValidImage()

  locationObj.varifyUploadImage()
  locationObj.validateMyLocation()
  cy.wait(300)
 // locationObj.detectAndValidateLocation();
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
//'step 5'


iroleObj.clickNextButton()
cy.wait(300)

//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateTitle()
reviewObj.validateStage()
reviewObj.clickPreButton()
iroleObj.validateStage()

loginObj.clickLogout()

})


// create project  by converting role from insurance to homeowner by filling step 5

   it('TC-14: Enter valid data in all steps for Homeowner by changing role from contractor ', { retries: 2 }, ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')

      
     step1Obj.changeRoleForHomeowner() //change role

  step1Obj.validateYourRole()
  step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

 // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');

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
reviewObj.varifyProjectType()
reviewObj.verifyLocation()
reviewObj.varifyStructureType()
reviewObj.varifyRoofPitch()
reviewObj.varifyRoofAge()
reviewObj.varifyMaterialLayer1()

// steps 7 click generate button

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()
loginObj.clickLogout()


})


//===== Create project by changing Role from Contractor to Inspector with filling step 5


it('TC-15: Create project by changing Role Inspector with filling step 5 adding slope ', { retries: 2 }, ()=>{

cy.log("======= Entring Data in step 1 with step 5 without adding slope ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')


     
     step1Obj.changeRoleForInspector()
    // cy.selectRole('inspector');


      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

   // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');

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
matObj.selectRandomMaterialSingle()

cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()

/*
//step 5 start
const slopeName = faker.company.name();


iroleObj2.scenarioWithSingleSlope(slopeName)

cy.wrap(slopeName).as('slopeName');
*/
iroleObj2.clickNextButton()



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

// steps 7 click generate button

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()
loginObj.clickLogout()

})


//===== Create project by changing Role to Contractor with filling step 5


it('TC-16: Create project by changing Role to Contractor with filling step 5 ', { retries: 2 }, ()=>{

cy.log("======= Entring Data ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
 
         
     step1Obj.changeRoleForContractor()

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()
  step1Obj.validateStep2()

  
  // start step 2

        cy.log("======= Entring Data in step 2 ======")
  step1Obj.validateStep2()
locationObj.enterCountry('USA');
cy.wrap('USA').as('country');

locationObj.enterCity('Houston');
cy.wrap('Houston').as('city');

locationObj.enterZipCode('77001');
cy.wrap('77001').as('zipCode');
  
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
matObj.selectRandomMaterialSingle()

cy.get('@layer').then(val => {
  cy.log("Selected:", val);
});



matObj.clickNextButton()


//step 5 start

cy.log("======= Starting step 5, entring valid data ======")

croleObj.validateStage()

croleObj.clickNextButton()
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

// steps 7 click generate button

reviewObj.clickGenerateEstimateButton()
cy.wait(2000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()


loginObj.clickLogout()

})


//validate Language


    const japaneseGreeting = '保険請求報告書';

  it('TC# 17: Validate PDF japanese Language', () => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);

      step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()


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
    matObj.selectRandomFeltType();
    matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */


   //    cy.get('button[role="combobox"]').eq(3).click({ force: true });
   // cy.contains('[role="option"]', 'German').click({ force: true });
    cy.get('div[class="grid gap-4 grid-cols-1"] div[class="space-y-2"] button[role="combobox"]').click({ force: true });
 cy.contains('[role="option"]', 'Japanese').click({ force: true });
//    cy.contains('[role="option"]', 'Japanese').click({ force: true });

    

    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
    reviewObj.varifyProjectType();
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
          pdfText.toUpperCase(),
          'PDF should contain japanese greeting'
        ).to.include(japaneseGreeting);

      });
    })
    loginObj.clickLogout();
  });


  
    const chineseGreeting = '保险索赔报告';

  it('TC# 18: Validate PDF chinese Language', () => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');
step1Obj.enterProjectName(projectName);

     step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
  step1Obj.clickNextButton()

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
    matObj.selectRandomFeltType();
    matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */


    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('div[class="grid gap-4 grid-cols-1"] div[class="space-y-2"] button[role="combobox"]').click({ force: true });
    cy.contains('[role="option"]', 'Chinese').click({ force: true });

    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
    reviewObj.varifyProjectType();
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
          pdfText.toUpperCase(),
          'PDF should contain chinese greeting'
        ).to.include(chineseGreeting);

      });
    })
    loginObj.clickLogout();
  });

    const portugueseGreeting = 'METADADOS DA RECLAMAÇÃO';

  it('TC# 19: Validate PDF Portuguese Language',  { retries: 2 },() => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
   
     step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
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
    matObj.selectRandomFeltType();
    matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('div[class="grid gap-4 grid-cols-1"] div[class="space-y-2"] button[role="combobox"]').click({ force: true });
    cy.contains('[role="option"]', 'Portuguese').click({ force: true });

    
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
    reviewObj.varifyProjectType();
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
          pdfText.toUpperCase(),
          'PDF should contain portuguese greeting'
        ).to.include(portugueseGreeting);

      });
    })
    loginObj.clickLogout();
  });



   // Stable greeting used only to detect Itali language
  const italianGreeting = 'METADATI DEL SINISTRO'

  it('TC# 20: Validate PDF italian Language',  { retries: 2 },() => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);

     step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
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
    matObj.selectRandomFeltType();
    matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

   

    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('div[class="grid gap-4 grid-cols-1"] div[class="space-y-2"] button[role="combobox"]').click({ force: true });
    cy.contains('[role="option"]', 'Italian').click({ force: true });

    
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
    reviewObj.varifyProjectType();
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
          pdfText.toUpperCase(),
          'PDF should contain italian greeting'
        ).to.include(italianGreeting);

      });
    })
    loginObj.clickLogout();
  });

  
  
      // Stable greeting used only to detect french language
   const frenchGreeting = "MÉTADONNÉES DE RÉCLAMATION";
  
    it('TC# 21: Validate PDF french Language',  { retries: 2 },() => {
  
      /* =========================
         STEP 1 – PROJECT INFO
      ========================== */
  
      const projectName = faker.company.buzzAdjective();
      cy.wrap(projectName).as('savedProjectName');
  
      step1Obj.enterProjectName(projectName);
      
       step1Obj.validateYourRole()
       
          step1Obj.selectProjectTypeDropdown()
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
      matObj.selectRandomFeltType();
      matObj.selectRandomCheckboxes();
  
      matObj.clickNextButton();
  
      /* =========================
         STEP 5 – USER DETAILS
      ========================== */
  
  
      // ✅ LANGUAGE SELECTION (FIXED)
      //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
       /* ======================
         STEP 5 – USER SELECTS GERMAN
         ====================== */
       cy.get('div[class="grid gap-4 grid-cols-1"] div[class="space-y-2"] button[role="combobox"]').click({ force: true });
      cy.contains('[role="option"]', 'French').click({ force: true });
  
      
      roleObj.clickNextButton();
  
      /* =========================
         STEP 6 – REVIEW
      ========================== */
  
      reviewObj.varifyProjectName();
      reviewObj.varifyRole();
      reviewObj.varifyProjectType();
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
            pdfText.toUpperCase(),
            'PDF should contain french greeting'
          ).to.include(frenchGreeting);
  
        });
      })
      loginObj.clickLogout();
    });
  
  

  // Stable greeting used only to detect Spanish language
  const spanishGreeting = 'METADATOS DE RECLAMO';

  it('TC# 22 : Validate PDF Spanish Language',  { retries: 2 },() => {

    /* =========================
       STEP 1 – PROJECT INFO
    ========================== */

    const projectName = faker.company.buzzAdjective();
    cy.wrap(projectName).as('savedProjectName');

    step1Obj.enterProjectName(projectName);
   
     step1Obj.validateYourRole()
     
        step1Obj.selectProjectTypeDropdown()
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
    matObj.selectRandomFeltType();
    matObj.selectRandomCheckboxes();

    matObj.clickNextButton();

    /* =========================
       STEP 5 – USER DETAILS
    ========================== */

    
    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* ======================
       STEP 5 – USER SELECTS GERMAN
       ====================== */
    cy.get('div[class="grid gap-4 grid-cols-1"] div[class="space-y-2"] button[role="combobox"]').click({ force: true });
    cy.contains('[role="option"]', 'Spanish').click({ force: true });

    
    roleObj.clickNextButton();

    /* =========================
       STEP 6 – REVIEW
    ========================== */

    reviewObj.varifyProjectName();
    reviewObj.varifyRole();
    reviewObj.varifyProjectType();
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
          pdfText.toUpperCase(),
          'PDF should contain Spnish greeting'
        ).to.include(spanishGreeting);

      });
    })
        loginObj.clickLogout();
  });

 
 
   // Stable greeting used only to detect German language
   const germanGreeting = 'ANSPRUCHS-METADATEN';
 
   it('TC#23: Validate PDF German Language' , { retries: 2 }, () => {
 
     /* =========================
        STEP 1 – PROJECT INFO
     ========================== */
 
     const projectName = faker.company.buzzAdjective();
     cy.wrap(projectName).as('savedProjectName');
 
     step1Obj.enterProjectName(projectName);
 
         step1Obj.validateYourRole()
         step1Obj.selectProjectTypeDropdown()
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
 
 
     matObj.clickNextButton();
 
     /* =========================
        STEP 5 – USER DETAILS
     ========================== */
 
 
     // ✅ LANGUAGE SELECTION (FIXED)
     //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
      /* ======================
        STEP 5 – USER SELECTS GERMAN
        ====================== */
    cy.get('div[class="grid gap-4 grid-cols-1"] div[class="space-y-2"] button[role="combobox"]').click({ force: true });
     cy.contains('[role="option"]', 'German').click({ force: true });
 
     roleObj.clickNextButton();
 
     /* =========================
        STEP 6 – REVIEW
     ========================== */
 
     reviewObj.varifyProjectName();
     reviewObj.varifyRole();
     reviewObj.varifyProjectType();
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
           pdfText.toUpperCase(),
           'PDF should contain German greeting'
         ).to.include(germanGreeting);
 
       });
     })
     loginObj.clickLogout();
   });
 
   // check Claim Analysis

      it('TC#24: Validate Claim Analysis Page' ,() => {
 
     /* =========================
        STEP  – Page
     ========================== */
     cy.contains('Claim Analysis').click()
     
cy.get('h1').should('contain','Claim Analysis');   

      
     loginObj.clickLogout();
   });

    // check Coverage Review

      it('TC#25: Validate Coverage Review Page' , () => {
 
     /* =========================
        STEP  – Page
     ========================== */
     cy.contains('Coverage Review').click()
        
cy.get('h1').should('contain','Coverage Review');   

      
     loginObj.clickLogout();
   });
 


})
