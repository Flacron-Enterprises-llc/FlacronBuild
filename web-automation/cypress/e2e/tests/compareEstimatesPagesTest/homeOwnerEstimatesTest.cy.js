import myEstimatesHO from '../../../pages/myEstimatesHO'
import { verifyProjectReport} from '../../../support/reportAssertions';
import loginData from '../../../fixtures/loginData.json' //import data file
import login from '../../../pages/login'
import { slowCypressDown } from 'cypress-slow-down'


const estimateObj = new myEstimatesHO()
const loginObj = new login()


describe('My Estimates → Project Report Verificatione', () => {

   
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
    homeownerEmail: loginData.HEmail ,
    language: '@language',
    currency: '@currency'
  };
beforeEach(() => {

  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
   
  });

/*
  cy.intercept('GET', '/users', (req) => {
    return Cypress.Promise
      .delay(1000)
      .then(() => req.continue())
  }).as('users')
  */
  loginObj.openURL();
// Give Next.js time to load the session
    slowCypressDown(800) 

    cy.get('body').then(($body) => {
        const isEmailVisible = $body.find('input[placeholder="Email"]').length > 0;
        const isProfileMenuVisible = $body.find('button[aria-haspopup="menu"]').length > 0;

        // SCENARIO 1: We are on the Login Window
        if (isEmailVisible) {
            cy.log('👉 Scenario 1: On Login Window - Entering Credentials');
            loginObj.enterValidEmail(loginData.HEmail);
            loginObj.enterPassword(loginData.Hpassword);
            loginObj.clickButton();
              estimateObj.navigateToMyEstimates()   
        } 
        
        // SCENARIO 2: Already Logged In (User is on Dashboard)
        else if (isProfileMenuVisible) {
            cy.log('👉 Scenario 2: Already Logged In - Resetting via Logout');
            loginObj.clickLogout(); 
            cy.reload();
            // Now that we are logged out, go to login
            loginObj.clickProfileIcon();
            loginObj.enterValidEmail(loginData.HEmail);
            loginObj.enterPassword(loginData.Hpassword);
            loginObj.clickButton();
            
   estimateObj.navigateToMyEstimates()   
        } 
        // SCENARIO 3: On Landing Page (Not logged in, Email not visible yet)
else {
    cy.log('👉 Scenario 3: On Landing Page - Clicking Profile to show Login');
    
    // 1. Click and force it in case of invisible overlays
    loginObj.clickProfileIcon(); 

    // 2. THE FIX: Explicitly wait for the element to exist in the DOM 
    // before checking if it is visible.
    cy.get('input[placeholder="Email"]', { timeout: 15000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled') // Ensures React has activated the field
        .focus()
        .type(loginData.HEmail, { delay: 50 });

    loginObj.enterPassword(loginData.Hpassword);
    loginObj.clickButton();
    
   estimateObj.navigateToMyEstimates()   
}
    });    
})

  // filter with valid date
it('TC_01: filter reports by valid date', () => {


  estimateObj.filterByDate()

});

//filter by invalid date

  //search filter
it('TC_01: filter reports by invalid date', () => {

  estimateObj.filterByInvalidDate()

});



it('TC_02: search project by valid name', () => {



  estimateObj.searchProject('testing123');
});

it('TC_03: search invalid project name', () => {

  estimateObj.searchProject('invalid123');  // on no project found, message should be displayed " no project found"
});


  it('TC_01: should display correct report after generation', () => {


    cy.openProjectFromMyEstimates(reportData.project);

    verifyProjectReport(reportData);
  });




it.only('TC_02: downloads project report PDF successfully', () => {
  

  
  const projectName = 'testing123'

// 1. Search project
estimateObj.searchProject(projectName)

// 2. Click download PDF button
cy.contains('div > div.grid > div.text-card-foreground', projectName)
  .should('be.visible')
  .within(() => {

    
    cy.get("button[title='Download PDF']")
      .click({ force: true })
  })

// 3. Validate file download
cy.task('getDownloadedFiles').then((files) => {
  const pdf = files.find(f => f.includes(projectName))
  expect(pdf).to.exist
})


});

it.skip('TC_03: downloads report in selected language', () => {


  cy.saveSelectedLanguage();   // Step 5
  cy.saveProjectName();        // Earlier step

  cy.generateReport();

  cy.verifyPdfDownload();      // already implemented
  cy.verifyPdfLanguageFromAliases();  //chaeck downloaded pdf should be displayed in selected language
});


it.skip('TC_04: generates and downloads PDF report in all supported languages', () => {
  cy.getAllLanguagesFromStep5();

  cy.get('@languages').then((languages) => {
    languages.forEach((language) => {
      cy.selectLanguageAndSave(language);

      cy.generateReport();

      cy.verifyPdfDownload();      // existing command
      cy.verifyPdfLanguageFromAlias();

      cy.reload(); // reset state before next iteration
    });
  });
});


it('TC_04: Validate PDF download with exact filename pattern', () => {
    const userEmail = "qwkhire_gmail_com_";
    const projectName = "@projectName"; 
    const projectDate = "date"; // Adjust if your app uses DD-MM-YYYY

    // Step 1: Navigate to the detail page (Image e1.png -> e2.png)
    estimatesPage.navigateToMyEstimates();
    estimatesPage.viewReportByName(projectName);

    // Step 2: Trigger download (Image e2.png)
    estimatesPage.downloadReport();

    // Step 3: Verify the specific filename and content
    // This handles the email+projectName+date+flacronBuild pattern
    estimatesPage.verifyDownloadedPdf(userEmail, projectName, projectDate);
});

it('TC_05: Should generate report, find it in My Estimates, and validate details', () => {
        // 1. Navigate to My Estimates
        estimatesPage.navigateToMyEstimates();

        // 2. Locate the report created (Image e1.png)
        cy.contains(testProject.name).should('be.visible');
        cy.contains(testProject.location).should('be.visible');

        // 3. Click View Icon to open Detail Page
        estimatesPage.viewReportByName(testProject.name);

        // 4. Validate Data on the final Detail Page (Image e2.png)
        const validationSet = {
            "Project:": testProject.name,
            "Location:": testProject.location,
            "Structure Type:": testProject.structure,
            "Roof Pitch:": testProject.pitch,
            "Homeowner Name:": "Qwkhire3"
        };
        
        estimatesPage.validateReportSummary(validationSet);

        // 5. Perform Download Action
        estimatesPage.downloadReport();
    });

after(() => {
  
  loginObj.clickLogout()
})

});