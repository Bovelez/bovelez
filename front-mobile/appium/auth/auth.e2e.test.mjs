import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { AuthScreen } from '../screens/auth.screen.mjs';
import { registerUser, uniqueEmail } from '../support/test-data.mjs';
import { AppiumBrowser } from '../support/webdriver.mjs';

const app = new AppiumBrowser();
const auth = new AuthScreen(app);

describe('Auth - mobile E2E flows', () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  it('registers a new user and lands on the app', async () => {
    const email = uniqueEmail('register');
    await auth.resetOnRegister();

    await auth.register({
      name: 'Test User',
      email,
      password: 'Password123',
    });

    await app.waitForUrl(/\/app\/dashboard$/, 15000);
  });

  it('shows an error when registering with an already taken email', async () => {
    const email = uniqueEmail('dup');
    await auth.resetOnRegister();

    await auth.register({
      name: 'Test User',
      email,
      password: 'Password123',
    });
    await app.waitForUrl(/\/app\/dashboard$/, 15000);

    await app.clearBrowserStorage();
    await auth.openRegister();
    await auth.register({
      name: 'Test User',
      email,
      password: 'Password123',
    });

    assert.ok((await auth.globalErrorText()).length > 0);
  });

  it('logs in with valid credentials and lands on the app', async () => {
    const user = await registerUser('login');
    await auth.resetOnLogin();

    await auth.login(user.email, user.password);

    await app.waitForUrl(/\/app\/dashboard$/, 15000);
  });

  it('shows an error on wrong password', async () => {
    const user = await registerUser('wrongpw');
    await auth.resetOnLogin();

    await auth.login(user.email, 'wrongpassword');

    assert.ok((await auth.globalErrorText()).length > 0);
  });
});
