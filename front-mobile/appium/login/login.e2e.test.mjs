import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { AppiumBrowser } from "../support/webdriver.mjs";

const app = new AppiumBrowser();

describe("login mobile E2E", () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  it("opens the login page from the landing CTA", async () => {
    await app.url("/");
    await app.clearBrowserStorage();
    await app.url("/");

    await app.click('[data-testid="landing-cta-login"]');

    await app.expectUrlToMatch(/\/login$/);
    assert.equal(await app.text('[data-testid="submit-btn"]'), "Iniciar sesión");
  });

  it("navigates from login to register", async () => {
    await app.url("/login");
    await app.clearBrowserStorage();
    await app.url("/login");

    await app.click('[data-testid="go-to-register"]');

    await app.expectUrlToMatch(/\/register$/);
    assert.equal(await app.text('[data-testid="submit-btn"]'), "Crear cuenta");
  });

  it("shows required validation errors", async () => {
    await app.url("/login");
    await app.clearBrowserStorage();
    await app.url("/login");

    await app.click('[data-testid="submit-btn"]');

    const errors = await app.allText('[role="alert"]');
    assert.ok(errors.includes("Email inválido"));
    assert.ok(errors.includes("La contraseña es requerida"));
  });

  it("shows an error for invalid credentials", async () => {
    await app.url("/login");
    await app.clearBrowserStorage();
    await app.url("/login");

    await app.type('[data-testid="email-input"]', "missing.user@example.com");
    await app.type('[data-testid="password-input"]', "password123");
    await app.click('[data-testid="submit-btn"]');

    assert.equal(await app.text('[data-testid="global-error"]'), "Invalid credentials");
  });

  it("logs in with the seeded user", async () => {
    await app.url("/login");
    await app.clearBrowserStorage();
    await app.url("/login");

    await app.type('[data-testid="email-input"]', "juan@email.com");
    await app.type('[data-testid="password-input"]', "password123");
    await app.click('[data-testid="submit-btn"]');

    await app.waitForUrl(/\/app\/dashboard$/, 15000);
    assert.match(await app.text('[data-testid="dashboard"]'), /panel de mi portfolio/i);
  });
});
