import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { AppiumBrowser } from "../support/webdriver.mjs";

const app = new AppiumBrowser();

describe("register mobile E2E", () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  it("opens the register page from the landing CTA", async () => {
    await app.url("/");

    assert.match(await app.text('[data-testid="landing-headline"]'), /Invertí en tu futuro/);

    await app.click('[data-testid="landing-cta-register"]');

    await app.expectUrlToMatch(/\/register$/);
    assert.equal(await app.text('[data-testid="submit-btn"]'), "Crear cuenta");
  });

  it("navigates from register to login", async () => {
    await app.url("/register");

    await app.click('[data-testid="go-to-login"]');

    await app.expectUrlToMatch(/\/login$/);
    assert.equal(await app.text('[data-testid="submit-btn"]'), "Iniciar sesión");
  });

  it("shows required validation errors", async () => {
    await app.url("/register");

    await app.click('[data-testid="submit-btn"]');

    const errors = await app.allText('[role="alert"]');
    assert.ok(errors.includes("El nombre es requerido"));
    assert.ok(errors.includes("Email inválido"));
    assert.ok(errors.includes("La contraseña debe tener al menos 8 caracteres"));
  });

  it("shows an error when passwords do not match", async () => {
    await app.url("/register");

    await app.type('[data-testid="name-input"]', "Pedro QA");
    await app.type('[data-testid="email-input"]', "pedro.qa@example.com");
    await app.type('[data-testid="password-input"]', "Password123");
    await app.type('[data-testid="confirm-password-input"]', "Password456");
    await app.click('[data-testid="submit-btn"]');

    const errors = await app.allText('[role="alert"]');
    assert.ok(errors.includes("Las contraseñas no coinciden"));
  });

  it("creates an account and redirects to the dashboard", async () => {
    await app.url("/register");
    await app.clearBrowserStorage();
    await app.url("/register");

    const email = `appium.register.${Date.now()}@example.com`;

    await app.type('[data-testid="name-input"]', "Appium Register");
    await app.type('[data-testid="email-input"]', email);
    await app.type('[data-testid="password-input"]', "Password123");
    await app.type('[data-testid="confirm-password-input"]', "Password123");
    await app.click('[data-testid="submit-btn"]');

    await app.waitForUrl(/\/app\/dashboard$/, 15000);
    assert.match(await app.text('[data-testid="dashboard"]'), /panel de mi portfolio/i);
  });
});
