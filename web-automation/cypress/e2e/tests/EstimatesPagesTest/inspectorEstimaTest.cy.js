

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
const estimateObj = new myEsrimates()
const croleObj = new contractorRole()
const iroleObj = new inspectorRole() //for step 5


// import all data json file from fixtures folder
import loginData from '../../../fixtures/loginData.json' //import data file for images and data



describe('Create project', () => {

   
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
      
      
    // cy.ensureLoggedIn(loginData.HEmail, loginData.Hpassword)
  })
  slowCypressDown(200) 
  
  // filter with valid date
it('TC_01: Generate project and check Date filter reports by valid current date', () => {
      
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


  estimateObj.filterByDate()
  loginObj.clickLogout();

});

//filter by invalid date

  //search filter
it('TC_02: filter reports by invalid date',{ retries: 2 }, () => {
   
    cy.wait(200)
    cy.contains('My Estimates').click({force: true})
  estimateObj.filterByInvalidDate()
  loginObj.clickLogout();

});



it('TC_03: On search invalid project name , message should be displayed "No project found"',{ retries: 2 }, () => {

    cy.wait(200)
  cy.contains('My Estimates').click({force: true})

  estimateObj.searchProject('invalid123');  // on no project found, message should be displayed " no project found"
loginObj.clickLogout();
});




it('TC_04: Create project and validate download icon by searching created project ', function () {

 
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
cy.wait(2000)

reviewObj.validateProjectOnMyEstimatesPage()
         
  
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
  
  //const projectName = 'testing123';
  const downloadsFolder = "cypress/downloads";

  // 1️⃣ Search project
  estimateObj.searchProject(projectName);
 cy.wait(300)
  // 2️⃣ Click Download PDF button
  cy.contains('div > div.grid > div.text-card-foreground', projectName)
    .should('be.visible')
    .within(() => {
      cy.get("button[title='Download PDF']")
        .click({ force: true });
    });

  // 3️⃣ Wait briefly for file download (can optimize later)
  cy.wait(4000);

  // 4️⃣ Get latest downloaded file
  cy.task("getLatestPdf", downloadsFolder).then((latestPath) => {

    // ✅ Validate file exists
    expect(latestPath, "PDF file should exist").to.not.be.null;
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
            });
          });
        });
      });
    
    })
    })
  })


  })
   
  });

  // 7️⃣ Logout
  loginObj.clickLogout();

});


it('TC_05: Should generate report, find it in My Estimates Page, and validate details by clicking eye icon', () => {

      
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
cy.wait(2000)

reviewObj.validateProjectOnMyEstimatesPage()

cy.wait(200)

  // 1️⃣ Search project
 estimateObj.filterByDate()
cy.wait(4000)
  estimateObj.searchProject(projectName);
 cy.wait(4000)
  // 2️⃣ Click Download PDF button

  cy.contains('div > div.grid > div.text-card-foreground', projectName)
    .should('be.visible')
    .within(() => {
      cy.get("button[title='View Report']")
        .click({ force: true });
    });
  


        // 3. Click View Icon to open Detail Page
   //     estimateObj.viewReportByName(reportData.name);

        // 4. Validate Data on the final Detail Page (Image e2.png)
      const validationSet = {
    "Project:": reportData.name,
    "Location:": reportData.location,
    "Structure Type:": reportData.structure,
    "Roof Pitch:": reportData.pitch,
    "Homeowner Name:": "Qwkhire3",
}
cy.get('@savedProjectName').then(projectName => {
  cy.get('@country').then(country => {
    cy.get('@city').then(city => {
      cy.get('@zipCode').then(zipCode => {
        cy.get('@structureType').then(structure => {
          cy.get('@roofPitch').then(pitch => {
            cy.get('@layer').then(layer => {

              const validationSet = {
                "Project:": projectName,
                "Location:": `${city}, ${country} ${zipCode}`,
                "Structure Type:": structure,
                "Roof Pitch:": pitch,
              //  "Material:": layer,
              };

              estimateObj.validateReportSummary(validationSet);

            });
          });
        });
      });
    });
  });
});
 loginObj.clickLogout();
          
    });

it('TC_06: Validate Delete icon for created project', () => {

 
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
cy.wait(2000)

reviewObj.validateProjectOnMyEstimatesPage()
 estimateObj.filterByDate();
  estimateObj.searchProject(projectName);

  // ===== VALIDATE PROJECT EXISTS =====
  cy.contains(projectName).should('be.visible');

  // ===== CLICK DELETE ICON =====
  cy.contains(projectName)
    .closest('[class*="card"]')
    .within(() => {
      cy.get("button[title='Delete Report']")
        .should('be.visible')
        .click();
    });

  // ===== VALIDATE CONFIRMATION MODAL =====
  cy.contains('Are you sure')
    .should('be.visible');

  cy.contains('Yes')
    .should('be.visible')
    .click();

  // ===== VALIDATE SUCCESS MESSAGE =====
  cy.contains('deleted successfully')
    .should('be.visible');

  // ===== VALIDATE PROJECT REMOVED =====
  cy.contains(projectName)
    .should('not.exist');

    cy.reload();
estimateObj.searchProject(projectName);
cy.contains(projectName).should('not.exist');


  loginObj.clickLogout();
});

});