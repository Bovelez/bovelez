describe("Auth - E2E flows", () => {
    it("registers a new user and lands on the app", () => {
        const email = `register-${Date.now()}@test.com`;
        cy.visit("/register");
        cy.fillRegisterForm({ nombre: "Test User", email, password: "password123" });
        cy.url().should("include", "/app");
    });

    it("shows an error when registering with an already taken email", () => {
        const email = `dup-${Date.now()}@test.com`;
        cy.visit("/register");
        cy.fillRegisterForm({ nombre: "Test User", email, password: "password123" });
        cy.url().should("include", "/app");

        cy.clearLocalStorage();
        cy.visit("/register");
        cy.fillRegisterForm({ nombre: "Test User", email, password: "password123" });
        cy.getByTestId("global-error").should("be.visible");
    });

    it("logs in with valid credentials and lands on the app", () => {
        const email = `login-${Date.now()}@test.com`;
        cy.request("POST", "/api/auth/register", {
            name: "Test User",
            email,
            password: "password123",
        });
        cy.visit("/login");
        cy.fillLoginForm(email, "password123");
        cy.url().should("include", "/app");
    });

    it("shows an error on wrong password", () => {
        const email = `wrongpw-${Date.now()}@test.com`;
        cy.request("POST", "/api/auth/register", {
            name: "Test User",
            email,
            password: "password123",
        });
        cy.visit("/login");
        cy.fillLoginForm(email, "wrongpassword");
        cy.getByTestId("global-error").should("be.visible");
    });
});
