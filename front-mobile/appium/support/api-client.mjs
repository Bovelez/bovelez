const API_BASE_URL = process.env.MOBILE_E2E_API_URL ?? 'http://localhost:18080';

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(
  path,
  { method = 'GET', body, token, failOnStatusCode = true } = {},
) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (failOnStatusCode && !response.ok) {
    throw new Error(
      `${method} ${path} failed with ${response.status}: ${text}`,
    );
  }

  return { status: response.status, body: payload };
}
