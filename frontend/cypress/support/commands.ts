Cypress.Commands.add("getByTestId", (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add(
  "fillLoginForm",
  (email: string, password: string, intercept = true) => {
    if (intercept) {
      cy.fixture("usuario").then((u) => {
        cy.intercept("POST", /\/auth\/login/, {
          statusCode: 200,
          body: u.authResponse,
        }).as("loginRequest");
        cy.intercept("GET", /\/auth\/me/, {
          statusCode: 200,
          body: u.authResponse.user,
        }).as("meRequest");
      });
    }

    cy.getByTestId("email-input").clear().type(email);
    cy.getByTestId("password-input").clear().type(password);
    cy.getByTestId("submit-btn").click();
  }
);

Cypress.Commands.add(
  "fillRegisterForm",
  (
    fields: {
      nombre: string;
      email: string;
      password: string;
      confirmPassword?: string;
      acceptTerms?: boolean;
    },
    intercept = true
  ) => {
    const { nombre, email, password, confirmPassword = password } = fields;

    if (intercept) {
      cy.fixture("usuario").then((u) => {
        cy.intercept("POST", /\/auth\/register/, {
          statusCode: 200,
          body: u.authResponse,
        }).as("registerRequest");

        cy.intercept("GET", /\/auth\/me/, {
          statusCode: 200,
          body: u.authResponse.user,
        }).as("meRequest");
      });
    }

    cy.getByTestId("name-input").clear().type(nombre);
    cy.getByTestId("email-input").clear().type(email);
    cy.getByTestId("password-input").clear().type(password);
    cy.getByTestId("confirm-password-input").clear().type(confirmPassword);
    cy.getByTestId("submit-btn").click();
  }
);

Cypress.Commands.add("shouldHaveFieldErrors", () => {
  cy.get('[role="alert"]').should("have.length.at.least", 1);
});

Cypress.Commands.add("shouldHaveGlobalError", () => {
  cy.getByTestId("global-error").should("be.visible");
});
