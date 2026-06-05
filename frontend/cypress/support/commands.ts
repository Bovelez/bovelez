/// <reference path="./index.d.ts" />

Cypress.Commands.add("getByTestId", (testId: string) => {
    return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add("resetDb", () => {
    cy.request("POST", "/api/test/reset").its("status").should("eq", 200);
});

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

Cypress.Commands.add("loginAsUser", () => {
    const email = `e2e-${Date.now()}@test.com`;
    cy.request("POST", "/api/auth/register", {
        name: "E2E User",
        email,
        password: "password123",
    }).then((res) => {
        cy.visit("/");
        cy.window().then((win) => {
            win.localStorage.setItem("auth_token", res.body.token);
        });
    });
});

Cypress.Commands.add("ensureInWatchlist", (ticker: string) => {
    cy.window().its("localStorage").invoke("getItem", "auth_token").then((token) => {
        cy.request({
            method: "POST",
            url: "/api/watchlist",
            body: { ticker },
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false,
        });
    });
});

Cypress.Commands.add("ensureNotInWatchlist", (ticker: string) => {
    cy.window().its("localStorage").invoke("getItem", "auth_token").then((token) => {
        cy.request({
            method: "DELETE",
            url: `/api/watchlist/${ticker}`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false,
        });
    });
});

Cypress.Commands.add("visitTransactions", () => {
    cy.visit("/app/transactions");
    cy.get("[data-cy=transactions-list], [data-cy=transactions-list-empty]", { timeout: 8000 }).should("exist");
});

Cypress.Commands.add("visitStock", (ticker: string) => {
    cy.visit(`/app/stock/${ticker}`);
    cy.get("[data-cy=stock-detail], [data-cy=stock-not-found]", { timeout: 8000 }).should("exist");
});

Cypress.Commands.add("visitDashboard", () => {
    cy.visit("/app");
    cy.get("[data-cy=portfolio-table], [data-cy=portfolio-empty]", { timeout: 8000 }).should("exist");
});

Cypress.Commands.add("visitPortfolio", () => {
    cy.visit("/app/portfolio");
    cy.get("[data-cy=active-shares], [data-cy=ticker-explorer]", { timeout: 8000 }).should("exist");
});

Cypress.Commands.add("visitWatchlist", () => {
    cy.visit("/app/watchlist");
    cy.get("[data-cy=watchlist-table], [data-cy=watchlist-empty]", { timeout: 8000 }).should("exist");
});

Cypress.Commands.add("selectCompareChips", (...tickers: string[]) => {
    tickers.forEach((ticker) => {
        cy.get(`[data-cy=compare-ticker-chip][data-ticker=${ticker}]`).click();
    });
});
