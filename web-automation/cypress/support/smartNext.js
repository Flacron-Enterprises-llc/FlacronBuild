Cypress.Commands.add("smartNext", (nextBtnSelector) => {

  cy.get("form").within(() => {

    cy.get("input:not([type='hidden']), textarea, button[role='combobox'], select")
      .each($field => {

        const tag = $field.prop("tagName").toLowerCase();
        const type = $field.attr("type");
        const value = $field.val() || $field.text().trim();

        // Skip disabled or read-only fields
        if ($field.is(":disabled") || $field.is("[readonly]")) return;

        // If field already filled → skip
        if (value && value.length > 0) return;


        // -----------------------------
        // HANDLE TYPES
        // -----------------------------

        // TEXT INPUTS
        if (tag === "input" && type === "text") {
          cy.wrap($field).type("AutoFill", { force: true });
          return;
        }

        // NUMBER INPUTS
        if (tag === "input" && type === "number") {
          cy.wrap($field).type("10", { force: true });
          return;
        }

        // TEXTAREA
        if (tag === "textarea") {
          cy.wrap($field).type("Auto-filled description", { force: true });
          return;
        }

        // RADIX UI DROPDOWN
        if ($field.attr("role") === "combobox") {
          cy.wrap($field).click({ force: true });
          cy.get('[role="option"]').then($opts => {
            const r = Math.floor(Math.random() * $opts.length);
            cy.wrap($opts[r]).click({ force: true });
          });
          return;
        }

        // NATIVE <SELECT>
        if (tag === "select") {
          cy.wrap($field).find("option").then($opts => {
            const r = Math.floor(Math.random() * $opts.length);
            cy.wrap($field).select($opts[r].value, { force: true });
          });
          return;
        }

      });
  });

  // After filling everything → click Next
  cy.get(nextBtnSelector).click({ force: true });
});
