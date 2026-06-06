import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { AppiumBrowser } from '../support/webdriver.mjs';
import { registerUser, uniqueEmail } from '../support/e2e-helpers.mjs';

const app = new AppiumBrowser();

async function fillRegisterForm({
  name,
  email,
  password,
  confirmPassword = password,
}) {
  await app.type('[data-testid="name-input"]', name);
  await app.type('[data-testid="email-input"]', email);
  await app.type('[data-testid="password-input"]', password);
  await app.type('[data-testid="confirm-password-input"]', confirmPassword);
  await app.domClick('[data-testid="submit-btn"]');
}

async function fillLoginForm(email, password) {
  await app.type('[data-testid="email-input"]', email);
  await app.type('[data-testid="password-input"]', password);
  await app.domClick('[data-testid="submit-btn"]');
}

describe('Auth - mobile E2E flows', () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  it('registers a new user and lands on the app', async () => {
    const email = uniqueEmail('register');
    await app.url('/register');
    await app.clearBrowserStorage();
    await app.url('/register');

    await fillRegisterForm({
      name: 'Test User',
      email,
      password: 'Password123',
    });

    await app.waitForUrl(/\/app\/dashboard$/, 15000);
  });

  it('shows an error when registering with an already taken email', async () => {
    const email = uniqueEmail('dup');
    await app.url('/register');
    await app.clearBrowserStorage();
    await app.url('/register');

    await fillRegisterForm({
      name: 'Test User',
      email,
      password: 'Password123',
    });
    await app.waitForUrl(/\/app\/dashboard$/, 15000);

    await app.clearBrowserStorage();
    await app.url('/register');
    await fillRegisterForm({
      name: 'Test User',
      email,
      password: 'Password123',
    });

    assert.ok((await app.text('[data-testid="global-error"]')).length > 0);
  });

  it('logs in with valid credentials and lands on the app', async () => {
    const user = await registerUser('login');
    await app.url('/login');
    await app.clearBrowserStorage();
    await app.url('/login');

    await fillLoginForm(user.email, user.password);

    await app.waitForUrl(/\/app\/dashboard$/, 15000);
  });

  it('shows an error on wrong password', async () => {
    const user = await registerUser('wrongpw');
    await app.url('/login');
    await app.clearBrowserStorage();
    await app.url('/login');

    await fillLoginForm(user.email, 'wrongpassword');

    assert.ok((await app.text('[data-testid="global-error"]')).length > 0);
  });
});
