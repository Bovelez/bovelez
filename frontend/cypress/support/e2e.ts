import "./commands.js";

beforeEach(() => {
    cy.clearLocalStorage();
    cy.resetDb();
});