class compare {

  // ===== SELECTORS =====
  elements = {
    compareLink: () => cy.contains('Compare'),
   
    projectCards: () => cy.get('div.text-card-foreground'),

    compareBtn: () => cy.contains('Compare Selected '),
    searchInput: () => cy.get('input[placeholder="Search by name"]'),
    noResultMsg: () => cy.contains('No reports found. Create an estimate to see it here.'),
    comparisonPanel: () => cy.contains('Compare Selected'),
    viewPdfBtn: () => cy.contains('View PDF'),
    downloadPdfBtn: () => cy.contains('Download PDF'),
    backBtn: () => cy.contains('Back to Compare')
  };


  // ===== ACTIONS =====

 // Function to select the specific report card
reportCard(index) {
  return cy.get('div.text-card-foreground', { timeout: 10000 }).eq(index);
}



// Validation function updated to match your validationSet keys
validateField(container, label, expectedValue) {
  if (!expectedValue) return;

  cy.wrap(container)
    .contains(label)
    .closest('div.flex.justify-between')
    .should('contain.text', expectedValue);
}

  
/*
validateReportByProject(projectName, data) {
  cy.contains('div.text-card-foreground', projectName)
    .should('be.visible')
    .within(() => {

      this.validateField('Project:', data["Project:"]);
      this.validateField('Location:', data["Location:"]);
      this.validateField('Structure', data["Structure Type:"]);
      this.validateField('Felt:', data["Felt:"]);

      if (data["Drip Edge:"])
        this.validateField('Drip Edge:', data["Drip Edge:"]);

      if (data["Ice/Water Shield:"])
        this.validateField('Ice/Water Shield:', data["Ice/Water Shield:"]);

      if (data["Preferred Currency:"])
        this.validateField('Preferred Currency:', data["Preferred Currency:"]);
    });
}
    */
   validateReportByProject(projectName, data) {
  const self = this;   // preserve class context

  cy.contains('div.text-card-foreground', projectName)
    .should('be.visible')
    .within(() => {

      self.validateField('Project:', data["Project:"]);
      self.validateField('Location:', data["Location:"]);
      self.validateField('Structure', data["Structure Type:"]);
      self.validateField('Felt:', data["Felt:"]);

      if (data["Drip Edge:"])
        self.validateField('Drip Edge:', data["Drip Edge:"]);

      if (data["Ice/Water Shield:"])
        self.validateField('Ice/Water Shield:', data["Ice/Water Shield:"]);

      if (data["Preferred Currency:"])
        self.validateField('Preferred Currency:', data["Preferred Currency:"]);
    });
}


/*
// Private helper to make the code readable and avoid repetition
validateField(label, expectedValue) {
  if (expectedValue) {
    cy.contains(label)
      .next()
      .should('be.visible')
      .and('contain', expectedValue);
  } else {
    // If no value is passed, just check if the field label is there
    cy.contains(label).should('exist');
  }
} 
  

validateField(label, expectedValue) {
  if (!expectedValue) {
    cy.contains(label).should('exist');
    return;
  }

  cy.contains(label)
    .parent()
    .parent()
    .should('contain.text', expectedValue);
}

*/
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

}


   openComparePage() {
  this.elements.compareLink()
    .should('be.visible')
    .and('not.be.disabled')
    .click();
}

  

  selectProject() {
    this.elements.projectCards().click();
  }

  selectTwoProjects() {
     cy.get('body div div div div div:nth-child(2) div:nth-child(1)').click()
    
   // cy.get('body div div div div div:nth-child(2) div:nth-child(1)').click()
  }

  clickCompare() {
   // this.elements.compareBtn().click();
    cy.contains('Compare Selected').click()
  }

    clickCompareBt() {
   // disable mode
    cy.contains('Compare Selected').should('be.disabled')
  }
  searchProject(name) {
    this.elements.searchInput().clear().type(name);
  }

  goBack() {
    this.elements.backBtn().click();
  }


  // ===== VALIDATIONS =====

  validateProjectsVisible() {
    this.elements.projectCards()
      .should('have.length.greaterThan', 0);
  }

  validateCompareDisabled() {
    this.elements.compareBtn()
      .should('be.disabled');
  }

  validateCompareEnabled() {
    this.elements.compareBtn()
      .should('not.be.disabled');
  }

  validateNoResults() {
    this.elements.noResultMsg()
      .should('be.visible');
  }

  validateComparisonLoaded() {
    this.elements.comparisonPanel()
      .should('have.length', 2);
  }

  validatePdfButtons() {
    this.elements.viewPdfBtn().should('be.visible');
    this.elements.downloadPdfBtn().should('be.visible');
  }

  


}


export default compare;