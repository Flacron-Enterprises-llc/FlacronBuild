

import roleProject from '../../../pages/role&Project'
import login from '../../../pages/login'
import location from '../../../pages/location'
import roofDetails from '../../../pages/roofDetails'
import materials from '../../../pages/materials'
import inspectorRole from '../../../pages/inspectorRole'
import review from '../../../pages/review'
import role from '../../../pages/role'
import contractorRole from '../../../pages/contractorRole'
import insurance from '../../../pages/insuranceAdjusterRole'
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
const iroleObj = new inspectorRole() //for step 5
const reviewObj = new review()
const roleObj = new role()
const croleObj = new contractorRole()
const iroleObj1 = new inspectorRole()

// import all data json file from fixtures folder
import loginData from '../../../fixtures/loginData.json' //import data file

describe('Enter and validate data for Inspector Project' ,()=>{

  beforeEach(() => {
  
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
          loginObj.enterValidEmail(loginData.IEmail);
          loginObj.enterPassword(loginData.Ipassword);
          loginObj.clickButton();
      } 
      
      // SCENARIO 2: Already Logged In (Profile menu exists)
      else if (isProfileMenuVisible) {
          cy.log('👉 Scenario 2: Already Logged In - Resetting via Logout');
          loginObj.clickLogout(); 
          cy.reload(); // Force a fresh state
          loginObj.clickProfileIcon();
          cy.get('input[placeholder="Email"]', { timeout: 10000 }).should('be.visible').type(loginData.IEmail);
          loginObj.enterPassword(loginData.Ipassword);
          loginObj.clickButton();
      } 
      
      // SCENARIO 3: Landing Page (Fallback)
      else if (isLandingPageVisible) {
          cy.log('👉 Scenario 3: On Landing Page - Clicking Profile');
          loginObj.clickProfileIcon(); 
          
          // Wait for React to render the modal/form
          cy.get('input[placeholder="Email"]', { timeout: 15000 })
              .should('be.visible')
              .type(loginData.IEmail);
      
          loginObj.enterPassword(loginData.Ipassword);
          loginObj.clickButton();
      }
  });
          
  })
  slowCypressDown(200) 
  

   it('TC-1: Enter valid data in all steps for Inspecter without adding slope ',  { retries: 2 },()=>{

cy.log("======= Entring Data in step 1 with step 5 without adding slope ======")

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
/*
        cy.log("======= Uploading valid image ======")
        locationObj.uploadValidImage()

        locationObj.varifyUploadImage()
        locationObj.validateMyLocation()
        */
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

iroleObj.scenarioWithoutSlope()
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
cy.wait(1000)

reviewObj.validatedProjectGenerated()
cy.wait(1000)
reviewObj.verifySucessMessage()
cy.wait(2000)

reviewObj.validateProjectOnMyEstimatesPage()


// 1. Load the fixture FIRST
  cy.fixture('loginData.json').then((user) => {
    
    // 2. Assign the email from fixture to your reportData object
    // Use CEmail or whatever key you need
    reportData.email = user.IEmail; 
    
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
           cy.get('@selectedProjectType').then((expectedProjectType) => {
             cy.get('@inspectorName').then((expectedInsName) => {
              cy.get('@licenseNum').then((expectedLicNum) => {
                cy.get('@date').then((expectedDate) => {
                  cy.get('@wather').then((expectedWather) => {
               

        const downloadsFolder = "cypress/downloads";

         
        // 2. Find and Read the PDF
        cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {
          cy.task("readPdf", latestPath).then((extractedText) => {
            
            // Normalize PDF text to one long line of lowercase text
            const pdfContent = extractedText.replace(/\s+/g, ' ').toLowerCase();

            // 3. ACTUAL DATA VALIDATION
            // We verify that the VALUE we saved is present in the PDF
            
            cy.log(`Validating Actual Data: ${expectedStructure}, ${expectedInsName}, ${expectedLicNum},${expectedDate},${expectedWather},${expectedPitch}, ${expectedAge}, ${expectedMaterial},${expectedLocation},${expectedProjectType}`);

            // Name Value
            expect(pdfContent, 'Name Match').to.include(expectedInsName.toLowerCase().trim());

             // lICENSE NUumber Value
            expect(pdfContent, 'License Number Match').to.include(expectedLicNum);

            // Date Value
           // expect(pdfContent, 'Date Match').to.include(expectedDate);

            // Wather Value
            expect(pdfContent, 'Wather Match').to.include(expectedWather.toLowerCase());


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
      });
    });
  

})})})})})})
})
    })
  })
})

    })
  })
loginObj.clickLogout()

})

// add single slope


   it('TC-2: Enter valid data in all steps for Inspecter with adding slope ', { retries: 2 }, ()=>{

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
const slopeName = faker.company.name();


iroleObj.scenarioWithSingleSlope(slopeName)

cy.wrap(slopeName).as('slopeName');

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
    reportData.email = user.IEmail; 
    
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
           cy.get('@selectedProjectType').then((expectedProjectType) => {
             cy.get('@inspectorName').then((expectedInsName) => {
              cy.get('@licenseNum').then((expectedLicNum) => {
                cy.get('@date').then((expectedDate) => {
                  cy.get('@wather').then((expectedWather) => {
                    cy.get('@slopeName').then((expectedslopeName) => {
                   //   cy.get('@damageType').then((expecteddamageType) => {
                         cy.get('@damageSeverity').then((expecteddamageSeverity) => {
               

        const downloadsFolder = "cypress/downloads";

         
        // 2. Find and Read the PDF
        cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {
          cy.task("readPdf", latestPath).then((extractedText) => {
            
            // Normalize PDF text to one long line of lowercase text
            const pdfContent = extractedText.replace(/\s+/g, ' ').toLowerCase();

            // 3. ACTUAL DATA VALIDATION
            // We verify that the VALUE we saved is present in the PDF
            
            cy.log(`Validating Actual Data: ${expectedslopeName},${expectedStructure}, ${expectedInsName}, ${expectedLicNum},${expectedDate},${expectedWather},${expectedPitch}, ${expectedAge}, ${expectedMaterial},${expectedLocation},${expectedProjectType}`);

            // Name Value
            expect(pdfContent, 'Name Match').to.include(expectedInsName.toLowerCase().trim());

            // Damage Type Value
     //       expect(pdfContent, 'Damage Type Match').to.include(expecteddamageType.toLowerCase());


            // Damage Severity Value
            expect(pdfContent, 'Slop Name Match').to.include(expecteddamageSeverity.toLowerCase());

             // lICENSE NUumber Value
            expect(pdfContent, 'License Number Match').to.include(expectedLicNum);

            // Date Value
           // expect(pdfContent, 'Date Match').to.include(expectedDate);

            // Wather Value
           // expect(pdfContent, 'Wather Match').to.include(expectedWather.toLowerCase());


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
      });
    });
  
  })
})})})})})})
})
 //   })
  })
})
    })
  })
    })
  })
loginObj.clickLogout()

})

// add multiple slope



   it('TC-3: Enter valid data in all steps for Inspecter with adding multiple slope ', { retries: 2 }, ()=>{

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


iroleObj.scenarioWithMultipleSlopes()


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
    reportData.email = user.IEmail; 
    
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
           cy.get('@selectedProjectType').then((expectedProjectType) => {
             cy.get('@inspectorName').then((expectedInsName) => {
              cy.get('@licenseNum').then((expectedLicNum) => {
                cy.get('@date').then((expectedDate) => {
                  cy.get('@wather').then((expectedWather) => {
                    cy.get('@slope1').then((expectedslopeName1) => {
                      cy.get('@slope2').then((expectedslopeName2) => {
                    
                         cy.get('@damageSeverity').then((expecteddamageSeverity) => {
               

        const downloadsFolder = "cypress/downloads";

         
        // 2. Find and Read the PDF
        cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {
          cy.task("readPdf", latestPath).then((extractedText) => {
            
            // Normalize PDF text to one long line of lowercase text
            const pdfContent = extractedText.replace(/\s+/g, ' ').toLowerCase();

            // 3. ACTUAL DATA VALIDATION
            // We verify that the VALUE we saved is present in the PDF
            
            cy.log(`Validating Actual Data: ${expectedslopeName2},${expectedslopeName1},${expectedStructure}, ${expectedInsName}, ${expectedLicNum},${expectedDate},${expectedWather},${expectedPitch}, ${expectedAge}, ${expectedMaterial},${expectedLocation},${expectedProjectType}`);

            // Name Value
            expect(pdfContent, 'Name Match').to.include(expectedInsName.toLowerCase().trim());

            // Damage Type Value
     //       expect(pdfContent, 'Damage Type Match').to.include(expecteddamageType.toLowerCase());


            // Slop 1 Value
            expect(pdfContent, 'Slop Name 1 Match').to.include(expectedslopeName1.toLowerCase());
            // Slop 2 Value
            expect(pdfContent, 'Slop Name 2 Match').to.include(expectedslopeName2.toLowerCase());
           
             // lICENSE NUumber Value
            expect(pdfContent, 'License Number Match').to.include(expectedLicNum);

            // Date Value
           // expect(pdfContent, 'Date Match').to.include(expectedDate);

            // Wather Value
         //   expect(pdfContent, 'Wather Match').to.include(expectedWather.toLowerCase());


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
      });
    
  
  })})
})})})})})})
})
 
  })
})
    })
  })
    })
  })
})
  
loginObj.clickLogout()


})



//scanario 4, adding slope and remove it
   it('TC-4: Enter valid data in all steps for Inspecter with adding and removing slope ', { retries: 2 }, ()=>{

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


iroleObj.scenarioAddAndRemoveSlope()


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


loginObj.clickLogout()

})

 //scanario 5, adding slope but not fill details
   it('TC-5: Enter valid data in all steps for Inspecter with adding slope without detailes ', ()=>{

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


iroleObj.scenarioIncompleteSlope()


//iroleObj.clickNextButton()



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
cy.wait(1000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()

loginObj.clickLogout()

})

// pick past date in step 6 

   it.skip('TC-6: Enter valid data in all steps for Inspecter with past date in step 5 ', ()=>{

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
cy.wait(300)
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


iroleObj.pickPastDate()


iroleObj.clickNextButton()
 cy.contains('Please select correct date')
    .should('be.visible');



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

//detected Location varification
it.skip('TC-7: Varify Detected location after clicking detected by location', ()=>{

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
  locationObj.validateLocationDetection();  //detected location
  locationObj.clickNextButton()

})

 // nagative TC

 it('TC-8: validate error message on invalid image file', ()=>{

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
  
  locationObj.uploadInvaidImageFile()
  
  locationObj.clickNextButton()
   

// step 3
 
loginObj.clickLogout()

})


 it('TC-9: validate error message on uploading file size more than 10MB',  { retries: 2 },()=>{

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

locationObj.uploadInvaidImageSize()
  
  locationObj.clickNextButton()

 
loginObj.clickLogout()

})



 it('TC-10: Validate error message should displayed on leaving Mandatory field Project name on step 1', { retries: 2 }, ()=>{

       
      cy.log("======= Entring Data ======")

     
    step1Obj.clickNextButton()
 
    step1Obj.validateProjectNameForCon()

 
loginObj.clickLogout()
  
  })

 // email field with invalud email

 it.skip(' Validate steps dispalyed correct on step 1 page', ()=>{
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



 it('TC-11: validate image remove link is working ', ()=>{
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


 it('TC-12: validate empty zipcode error', { retries: 2 }, ()=>{
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
 
it('TC-12: Enter invalid roof age',  { retries: 2 },()=>{

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

 it('TC-13: Test by selecting multiple layes on material steps 4/6', ()=>{

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
cy.wait(1000)

reviewObj.validatedProjectGenerated()
cy.wait(2000)
reviewObj.verifySucessMessage()
cy.wait(4000)

reviewObj.validateProjectOnMyEstimatesPage()

loginObj.clickLogout()

})


// test to remove selected layers
 it('TC-14: Test by selecting multiple layes remove on material steps 4/6', { retries: 2 }, ()=>{

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
cy.wait(300)
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

cy.get('@layer2').then(val => {
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

matObj.deleteAddedLayed()

matObj.clickNextButton()


loginObj.clickLogout()

})

// Test Material step without selecting any layer and validate error

 it('TC-15: Test layes without selecting laye on material steps 4/6',  { retries: 2 },()=>{

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
cy.wait(600)
cy.log("======= Entring Data in steps 3 ======")
cy.log("======= Selecting random Roof Structure Type ======")
roofObj.selectRandomStructureType()
cy.wait(300)

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

 it('TC-16: Test layes wihtout selecting felt type on material steps 4/6',  { retries: 2 },()=>{
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
cy.log("======= Selecting random option from dropdown menu ======")

matObj.selectRandomMaterialSingle()

matObj.clickNextButton()



//step 5 start
/*
cy.log("======= Starting step 5, entring valid data ======")
inspectorRole.validateTitle()
inspectorRole.validateStage()

inspectorRole.selectRandomDropdowns()
inspectorRole.selectRandomCheckboxes()
*/

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




//step 6 start
cy.log("======= Starting step 6: varifying entred data in all steps ======")
reviewObj.validateStage()
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
cy.wait(800)
 
reviewObj.validatedProjectGenerated()
cy.wait(800)
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

// change role by Homeowner


   it('TC-17: Enter valid data in all steps for Homeowner by changing role from contractor skipping step 5',  { retries: 2 },()=>{

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


//creating project as a contractor from Insurance with skeping step 5


   it('TC-18: Enter valid data by skiping step 5 for Contractor ', { retries: 2 }, ()=>{

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


/// Insurance


// test creating project by changing role from contractor to Insurance Adjuster

   it('TC-19: Enter valid data in all steps for Insurance Adjuster with skeping step 5  ',  { retries: 2 },()=>{

cy.log("======= Entring Data in step 1 with step 5 with filling data  ======")

 //  Enter and SAVE Project Name
const projectName = faker.company.buzzAdjective()
     step1Obj.enterProjectName(projectName)
     cy.wrap(projectName).as('savedProjectName')
   

        
     step1Obj.changeRoleForInsurance()
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


loginObj.clickLogout()


})



//validate Language


    const japaneseGreeting = '専門家による検査報告書';

  it('TC# 20: Validate PDF japanese Language', () => {

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
/*
    roleObj.enterName(faker.person.firstName());
    roleObj.enterEmail(faker.internet.email());
    roleObj.selectProjectUrgency();
    roleObj.selectBudgetStyle();
*/
    // ✅ LANGUAGE SELECTION (FIXED)
    //roleObj.selectLanguage(); // MUST set @selectedLanguage alias
     /* =================
       STEP 5 – USER SELECTS GERMAN
       ====================== */

   //    cy.get('button[role="combobox"]').eq(3).click({ force: true });
   // cy.contains('[role="option"]', 'German').click({ force: true });
    cy.get('#\\:r4d\\:-form-item').click({ force: true });
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
    cy.wait(1000)
    reviewObj.validatedProjectGenerated();
    cy.wait(1000)
    reviewObj.verifySucessMessage();
    cy.wait(1000)

     
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


  
    const chineseGreeting = '专业检查员报告';

  it('TC# 21: Validate PDF chinese Language', () => {

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
    cy.get('#\\:r4d\\:-form-item').click({ force: true });
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
    cy.wait(1000)
    reviewObj.validatedProjectGenerated();
    cy.wait(1000)
    reviewObj.verifySucessMessage();
    cy.wait(1000)

     
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

    const portugueseGreeting = 'RELATÓRIO DO INSPETOR PROFISSIONAL';

  it('TC# 22: Validate PDF Portuguese Language',  { retries: 2 },() => {

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
    cy.get('#\\:r4d\\:-form-item').click({ force: true });
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
  const italianGreeting = 'RAPPORTO ISPETTORE PROFESSIONALE';

  it('TC# 23: Validate PDF italian Language', { retries: 2 }, () => {

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
    cy.get('#\\:r4d\\:-form-item').click({ force: true });
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
   const frenchGreeting = "RAPPORT D'INSPECTEUR PROFESSIONNEL";
  
    it('TC# 24: Validate PDF french Language', { retries: 2 }, () => {
  
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
       cy.get('#\\:r4d\\:-form-item').click({ force: true });
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
  const spanishGreeting = 'INFORME DEL INSPECTOR PROFESIONAL';

  it('TC# 25 : Validate PDF Spanish Language', { retries: 2 }, () => {

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
    cy.get('#\\:r4d\\:-form-item').click({ force: true });
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
   const germanGreeting = 'PROFESSIONELLER INSPEKTIONSBERICHT';
 
   it('TC#26: Validate PDF German Language' ,  { retries: 2 },() => {
 
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
    cy.get('#\\:r45\\:-form-item').click({ force: true });
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
 
      // check Inspection Report

      it('TC#27: Validate Inspection Report Page' , () => {
 
     /* =========================
        STEP  – Page
     ========================== */
     cy.contains('Inspection Report').click()
     
cy.get('h1').should('contain','Inspection Report');   

      
     loginObj.clickLogout();
   });

    // check Certification

      it('TC#28: Validate Certification Page' , () => {
 
     /* =========================
        STEP  – Page
     ========================== */
     cy.contains('Certification').click()
        
cy.get('h1').should('contain','Certification');   

      
     loginObj.clickLogout();
   });
 
 
 
})
