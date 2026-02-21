class deleteProjects {

    deleteAllProjects() {

        cy.get('body').then(($body) => {

            const deleteButtons = $body.find('button[title="Delete Report"]');

            if (deleteButtons.length > 0) {

                cy.log(`Deleting ${deleteButtons.length} project(s)`);

                cy.get('button[title="Delete Report"]')
                  .first()
                  .click({ force: true });

                // wait for DOM update (adjust if API is slow)
                cy.wait(1000);

                // call again until no buttons remain
                this.deleteAllProjects();

            } else {
                cy.log('No projects remaining ✅');
            }

        });

    }
}

export default new deleteProjects();