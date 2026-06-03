/// <reference path="./index.d.ts" />

// ── Helpers ────────────────────────────────────────────────────────────────

Cypress.Commands.add("getByTestId", (testId: string) => {
    return cy.get(`[data-testid="${testId}"]`);
});

// ── DB reset ───────────────────────────────────────────────────────────────

Cypress.Commands.add("resetDb", () => {
    cy.request("POST", "/api/test/reset").its("status").should("eq", 200);
});

// ── Auth ───────────────────────────────────────────────────────────────────

Cypress.Commands.add(
    "fillLoginForm",
    (email: string, password: string) => {
        cy.getByTestId("email-input").clear().type(email);
        cy.getByTestId("password-input").clear().type(password);
        cy.getByTestId("submit-btn").click();
    }
);

Cypress.Commands.add(
    "fillRegisterForm",
    (fields: {
        nombre: string;
        email: string;
        password: string;
        confirmPassword?: string;
        acceptTerms?: boolean;
    }) => {
        const { nombre, email, password, confirmPassword = password } = fields;

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

// loginAsUser hace login real y guarda el token en localStorage via cy.session
Cypress.Commands.add("loginAsUser", () => {
    cy.session("watchlist-user", () => {
        cy.fixture("usuario").then((u) => {
            cy.visit("/login");
            cy.getByTestId("email-input").type(u.email);
            cy.getByTestId("password-input").type(u.password);
            cy.getByTestId("submit-btn").click();
            cy.url().should("include", "/app");
            cy.window()
                .its("localStorage")
                .invoke("getItem", "auth_token")
                .should("exist");
        });
    });
});

// ── Watchlist ──────────────────────────────────────────────────────────────

Cypress.Commands.add("visitWatchlist", () => {
    cy.visit("/app/watchlist");
    // Espera a que la tabla cargue antes de que el test empiece a interactuar
    cy.get("[data-cy=watchlist-table], [data-cy=watchlist-empty]", { timeout: 8000 }).should("exist");
});

Cypress.Commands.add("interceptCompare", (alias: string, response: object | number) => {
    if (typeof response === "number") {
        cy.intercept("POST", "/api/watchlist/compare", { statusCode: response }).as(alias);
    } else {
        cy.intercept("POST", "/api/watchlist/compare", { statusCode: 200, body: response }).as(alias);
    }
});

Cypress.Commands.add("selectCompareChips", (...tickers: string[]) => {
    tickers.forEach((ticker) => {
        cy.get(`[data-cy=compare-ticker-chip][data-ticker=${ticker}]`).click();
    });
});