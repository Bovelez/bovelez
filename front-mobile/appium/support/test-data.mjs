import assert from 'node:assert/strict';
import { apiRequest } from './api-client.mjs';

const PASSWORD = 'Password123';

export function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

export async function registerUser(prefix = 'appium') {
  const email = uniqueEmail(prefix);
  const { body } = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Appium User',
      email,
      password: PASSWORD,
    },
  });

  assert.ok(body?.token, 'register response should include a token');
  return { email, password: PASSWORD, token: body.token };
}

export async function loginAsNewUser(app, prefix = 'appium') {
  const user = await registerUser(prefix);
  await app.url('/');
  await app.clearBrowserStorage();
  await app.execute(
    "window.localStorage.setItem('auth_token', arguments[0]);",
    [user.token],
  );
  return user;
}

export async function ensureInWatchlist(token, ticker) {
  await apiRequest('/watchlist', {
    method: 'POST',
    token,
    body: { ticker },
    failOnStatusCode: false,
  });
}

export async function ensureNotInWatchlist(token, ticker) {
  await apiRequest(`/watchlist/${ticker}`, {
    method: 'DELETE',
    token,
    failOnStatusCode: false,
  });
}
