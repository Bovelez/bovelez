describe("Login Page", () => {
  beforeEach(() => {
    cy.fixture("usuario").as("u");
    cy.visit("/login");
  });

  it("renders the left branding panel on large screens", () => {
    cy.viewport(1280, 800);
    cy.getByTestId("brand-panel").should("be.visible");
    cy.getByTestId("brand-title").should("contain.text", "VIPJM");
  });

  it("hides the left panel on mobile", () => {
    cy.viewport(375, 812);
    cy.getByTestId("brand-panel").should("not.be.visible");
  });

  it("renders the login form", () => {
    cy.getByTestId("email-input").should("exist");
    cy.getByTestId("password-input").should("exist");
    cy.getByTestId("submit-btn").should("exist");
  });

  it("shows validation errors when submitting empty form", () => {
    cy.getByTestId("submit-btn").click();
    cy.shouldHaveFieldErrors();
  });

  it("shows an error for invalid email format", function () {
    cy.getByTestId("email-input").type(this.u.emailInvalido);
    cy.getByTestId("submit-btn").click();
    cy.getByTestId("email-input").should("have.class", "border-[var(--danger)]");
  });

  it("toggles password visibility", () => {
    cy.getByTestId("password-input").should("have.attr", "type", "password");
    cy.getByTestId("toggle-password").click();
    cy.getByTestId("password-input").should("have.attr", "type", "text");
    cy.getByTestId("toggle-password").click();
    cy.getByTestId("password-input").should("have.attr", "type", "password");
  });

  it("displays a global error alert on invalid credentials", function () {
    cy.intercept("POST", /\/auth\/login/, {
      statusCode: 401,
      body: { message: "Credenciales incorrectas" },
    }).as("loginRequest");

    cy.fillLoginForm(this.u.email, "wrongpassword", false);

    cy.wait("@loginRequest");
    cy.shouldHaveGlobalError();
  });

  it("redirects to /app after successful login", function () {
    cy.intercept("POST", /\/auth\/login/, {
      statusCode: 200,
      body: this.u.authResponse,
    }).as("loginRequest");

    cy.intercept("GET", /\/auth\/me/, {
      statusCode: 200,
      body: this.u.authResponse.user,
    }).as("meRequest");

    cy.fillLoginForm(this.u.email, this.u.password, false);

    cy.wait("@loginRequest");
    cy.url().should("include", "/app");
  });

  it("redirects to the original destination after login (protected route)", function () {
    cy.visit("/app");
    cy.url().should("include", "/login");

    cy.intercept("POST", /\/auth\/login/, {
      statusCode: 200,
      body: this.u.authResponse,
    }).as("loginRequest");

    cy.intercept("GET", /\/auth\/me/, {
      statusCode: 200,
      body: this.u.authResponse.user,
    }).as("meRequest");

    cy.fillLoginForm(this.u.email, this.u.password, false);

    cy.wait("@loginRequest");
    cy.url().should("include", "/app");
  });

  it("disables the submit button while submitting", function () {
    cy.intercept("POST", /\/auth\/login/, (req) => {
      req.reply((res) => {
        res.setDelay(500);
        res.send({ statusCode: 200, body: this.u.authResponse });
      });
    }).as("slowLogin");

    cy.fillLoginForm(this.u.email, this.u.password, false);

    cy.getByTestId("submit-btn").should("be.disabled");
    cy.wait("@slowLogin");
  });

  it("navigates to /register when clicking 'Registrarse'", () => {
    cy.getByTestId("go-to-register").click();
    cy.url().should("include", "/register");
  });

});
