class myEsrimates{
        //Locators
    

    weblocators={
      
    myEstimateLink: '.hidden > :nth-child(3)',
    monthYear: '#react-day-picker-1',

    pname: '.space-y-2 > :nth-child(1) > .text-neutral-900',
    goBackButton: '.border-input',
    title: 'h1:has-text("My Estimates & Reports")',
    datePicker: '.md\:flex-row > :nth-child(1) > .inline-flex',
    searchByNameBox: ':nth-child(2) > .border-2',
    projectName: ':nth-child(1) > .rounded-t-2xl > .text-lg',
    date:':nth-child(1) > .flex.text-sm > .text-neutral-500',
    location: 'span:has-text("jj, jj")',
    role: 'span:has-text("Role: homeowner")',
    ai:'span:has-text("✓ AI Analysis Complete")',
    pdf: 'span:has-text("📄 PDF Available")',
    viewIcon: ':nth-child(1) > .gap-3 > .hover\:bg-blue-100',
    downloadPdfBtn: 'button[title="Download PDF"]',
    delectReportIcon: ':nth-child(1) > .gap-3 > .hover\:bg-red-100',
    projectCart: 'div > div.grid > div.text-card-foreground'
    
    }

verifyDownloadedPdf(userEmail, projectName, projectDate) {
        // 1. Format the email to match file system standards (qwkhire3_gmail_com)
        const formattedEmail = userEmail.replace(/[@.]/g, '_');
        
        // 2. Construct the exact filename: emailprojectNameDateFlacronBuild.pdf
        // Example: qwkhire3_gmail_comhh2025-12-21FlacronBuild.pdf
        const fileName = `${formattedEmail}${projectName}${projectDate}FlacronBuild.pdf`;
        const filePath = `cypress/downloads/${fileName}`;

        cy.log(`🔍 Attempting to read: ${fileName}`);

        // 3. Verify file exists first to avoid crashing the task
        cy.readFile(filePath, 'binary', { timeout: 15000 }).should('exist');

        // 4. Read and validate content
        cy.task('readPdf', filePath).then((pdfText) => {
            // Validations based on your screenshot com3.png
            expect(pdfText).to.contain('Project Report');
            expect(pdfText).to.contain(projectName);
            expect(pdfText).to.contain('Karachi, Pakistan');
            cy.log('✅ PDF content matches dashboard data');
        });
    }
    

    //search Project by name
    searchProject(projectName) {
  cy.get(this.weblocators.searchByNameBox)
    .clear()
    .type(projectName)
    .blur();

  cy.get('body').then(($body) => {
    if ($body.text().includes('Invalid')) {
      cy.contains('Invalid search').should('be.visible');
    } 
    else if ($body.find(this.weblocators.projectCart).length > 0) {
      cy.get(this.weblocators.projectCart)
        .each(($card) => {
          cy.wrap($card)
            .should('contain.text', projectName);
        });
    } 
    else {
      cy.contains('No project found').should('be.visible');
    }
  });
}
filterByDate() {

  const today = new Date();

  // Get current day number (e.g., 16)
  const currentDay = today.getDate();

  // Format date like: 16 Feb 2026
  const formattedDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // 1️⃣ Click date picker
  cy.contains('Pick a date').click();

  // 2️⃣ Select current day from calendar
  cy.contains(new RegExp(`^${currentDay}$`)).click();

  // 3️⃣ Validate project cards show today's date
  cy.get(this.weblocators.projectCart)
    .should('be.visible')
    .each(($card) => {
      cy.wrap($card)
        .contains(formattedDate)
        .should('be.visible');
    });

}

// cypress/e2e/pages/estimatePage.js

filterByInvalidDate() {

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const futureDay = tomorrow.getDate().toString();

  // Open date picker
  cy.contains('Pick a date')
    .should('be.visible')
    .click();

  // If month switches automatically, this still works
  cy.contains('button', new RegExp(`^${futureDay}$`))
    .should('be.visible')
    .click();

  // Validate no project cards displayed
  cy.get(this.weblocators.projectCart)
    .should('not.exist');
}


navigateToMyEstimates() {
        cy.get(this.weblocators.myEstimateLink).click();
        cy.url().should('include', '/my-estimates');
    }

    clickViewIcon(){

        cy.get(this.weblocators.clickViewIcon).click()


    }


    viewReportByName(projectName) {
        // Finds the specific card by name and clicks the eye icon inside it
       // cy.contains(this.elements.reportCardTitle, projectName)
        cy.contains(projectName)
            .parents('.rounded-2xl') 
            .find('button').first().click(); // Clicks the View/Eye icon
    }
    
   // cypress/e2e/pages/myEstimatesHO.js

validateReportSummary(expectedData) {
  Object.entries(expectedData).forEach(([label, value]) => {

    expect(value, `Value for ${label} should not be undefined`).to.not.be.undefined;

    cy.contains('div.flex.mb-1.text-base', label)
      .should('exist')
      .parent()
      .should('contain.text', value);
  });
}

 

        downloadReportIcon() {
        cy.get(this.weblocators.downloadPdfBtn).should('be.visible').click();
    }


    
        deleteReport() {
        cy.get(this.elements.delectReportIcon).should('be.visible').click();
    }

/*

selectDateFromCalendar(day) {
  cy.get(this.weblocators.datePicker).click()
  cy.contains('button', day).click()
}

*/

}

export default myEsrimates;