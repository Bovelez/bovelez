/// <reference path="./index.d.ts" />

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

Cypress.Commands.add("loginAsUser", () => {
    cy.session("watchlist-user", () => {
        cy.fixture("usuario").then((u) => {
            cy.intercept("POST", "/api/auth/login", {
                statusCode: 200,
                body: u.authResponse,
            }).as("loginReq");
            cy.intercept("GET", "/api/auth/me", {
                statusCode: 200,
                body: u.authResponse.user,
            }).as("meReq");

            cy.visit("/login");
            cy.getByTestId("email-input").type(u.email);
            cy.getByTestId("password-input").type(u.password);
            cy.getByTestId("submit-btn").click();
            cy.wait("@loginReq");
            cy.window()
                .its("localStorage")
                .invoke("getItem", "auth_token")
                .should("exist");
        });
    });
});

Cypress.Commands.add("visitWatchlist", () => {
    cy.fixture("usuario").then((u) => {
        cy.intercept("GET", "/api/auth/me", {
            statusCode: 200,
            body: u.authResponse.user,
        }).as("meRequest");
    });

    cy.fixture("watchlist").then((wl) => {
        cy.intercept("GET", "/api/watchlist", {
            statusCode: 200,
            body: wl.items,
        }).as("getWatchlist");

        cy.intercept("GET", "/api/prices", {
            statusCode: 200,
            body: wl.prices,
        }).as("getPrices");
    });

    cy.visit("/app/watchlist");
    cy.wait("@getWatchlist");
});

Cypress.Commands.add(
    "interceptCompare",
    (alias: string, response: object | number) => {
        if (typeof response === "number") {
            cy.intercept("POST", "/api/watchlist/compare", {
                statusCode: response,
            }).as(alias);
        } else {
            cy.intercept("POST", "/api/watchlist/compare", {
                statusCode: 200,
                body: response,
            }).as(alias);
        }
    }
);

Cypress.Commands.add("selectCompareChips", (...tickers: string[]) => {
    tickers.forEach((ticker) => {
        cy.get(`[data-cy=compare-ticker-chip][data-ticker=${ticker}]`).click();
    });
});