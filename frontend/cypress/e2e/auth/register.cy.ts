describe("Register Page", () => {
  beforeEach(() => {
    cy.fixture("usuario").as("u");
    cy.visit("/register");
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

  it("renders all form fields", () => {
    cy.getByTestId("name-input").should("exist");
    cy.getByTestId("email-input").should("exist");
    cy.getByTestId("password-input").should("exist");
    cy.getByTestId("confirm-password-input").should("exist");
    cy.getByTestId("submit-btn").should("exist");
  });

  it("shows validation errors when submitting an empty form", () => {
    cy.getByTestId("submit-btn").click();
    cy.shouldHaveFieldErrors();
  });

  it("shows an error when passwords do not match", function () {
    cy.fillRegisterForm(
      {
        nombre: this.u.nombre,
        email: this.u.email,
        password: this.u.password,
        confirmPassword: this.u.passwordDistinta,
      },
      false
    );

    cy.getByTestId("confirm-password-input").should(
      "have.class",
      "border-[var(--danger)]"
    );
  });

  it("shows an error when password is too short", function () {
    cy.getByTestId("password-input").type(this.u.passwordCorta);
    cy.getByTestId("submit-btn").click();
    cy.getByTestId("password-input").should("have.class", "border-[var(--danger)]");
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

  it("displays a global error alert when the API returns an error", function () {
    cy.intercept("POST", /\/auth\/register/, {
      statusCode: 409,
      body: { message: "El email ya está registrado" },
    }).as("registerRequest");

    cy.fillRegisterForm(
      { nombre: this.u.nombre, email: this.u.email, password: this.u.password },
      false
    );

    cy.wait("@registerRequest");
    cy.shouldHaveGlobalError();
  });

  it("redirects to /app after successful registration", function () {
    cy.intercept("POST", /\/auth\/register/, {
      statusCode: 200,
      body: this.u.authResponse,
    }).as("registerRequest");

    cy.intercept("GET", /\/auth\/me/, {
      statusCode: 200,
      body: this.u.authResponse.user,
    }).as("meRequest");

    cy.fillRegisterForm(
      { nombre: this.u.nombre, email: this.u.email, password: this.u.password },
      false
    );

    cy.wait("@registerRequest");
    cy.url().should("include", "/app");
  });

  it("disables the submit button while submitting", function () {
    cy.intercept("POST", /\/auth\/register/, (req) => {
      req.reply((res) => {
        res.setDelay(500);
        res.send({ statusCode: 200, body: this.u.authResponse });
      });
    }).as("slowRegister");

    cy.fillRegisterForm(
      { nombre: this.u.nombre, email: this.u.email, password: this.u.password },
      false
    );

    cy.getByTestId("submit-btn").should("be.disabled");
    cy.wait("@slowRegister");
  });

  it("navigates to /login when clicking 'Iniciar sesión'", () => {
    cy.getByTestId("go-to-login").click();
    cy.url().should("include", "/login");
  });
});
