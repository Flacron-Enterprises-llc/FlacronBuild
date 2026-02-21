export const verifyProjectReport = (data) => {
  cy.contains('Project:').next().should('have.text', data.project);
  cy.contains('Role:').next().should('have.text', data.role);
  cy.contains('Location:').next().should('have.text', data.location);
  cy.contains('Date:').next().should('have.text', data.date);

  cy.contains('Structure Type:').next().should('have.text', data.structureType);
  cy.contains('Roof Pitch:').next().should('have.text', data.roofPitch);
  cy.contains('Roof Age:').next().should('have.text', data.roofAge);
  cy.contains('Material Layers:').next().should('have.text', data.materialLayers);
  cy.contains('Felt:').next().should('have.text', data.felt);
  cy.contains('Ice/Water Shield:').next().should('have.text', data.iceWaterShield);
  cy.contains('Drip Edge:').next().should('have.text', data.dripEdge);
  cy.contains('Gutter Apron:').next().should('have.text', data.gutterApron);
  cy.contains('Homeowner Name:').next().should('have.text', data.homeownerName);
  cy.contains('Homeowner Email:').next().should('have.text', data.homeownerEmail);
  cy.contains('Preferred Language:').next().should('have.text', data.language);
  cy.contains('Preferred Currency:').next().should('have.text', data.currency);

  cy.contains('Download PDF').should('be.visible');
};
