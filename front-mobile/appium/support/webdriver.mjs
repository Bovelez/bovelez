import assert from "node:assert/strict";

const APPIUM_SERVER_URL = process.env.APPIUM_SERVER_URL
const DEVICE_NAME = process.env.APPIUM_DEVICE_NAME

export const MOBILE_E2E_BASE_URL =
  process.env.MOBILE_E2E_BASE_URL

export const ELEMENT_ID = "element-6066-11e4-a52e-4f735466cecf";

export class AppiumBrowser {
  sessionId;

  async request(method, path, body) {
    const response = await fetch(`${APPIUM_SERVER_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.value?.error) {
      const message = payload.value?.message ?? response.statusText;
      throw new Error(`${method} ${path} failed: ${message}`);
    }

    return payload.value;
  }

  async start() {
    const value = await this.request("POST", "/session", {
      capabilities: {
        alwaysMatch: {
          platformName: "Android",
          browserName: "Chrome",
          "appium:automationName": "UiAutomator2",
          "appium:deviceName": DEVICE_NAME,
          "appium:chromedriverAutodownload": true,
          "appium:newCommandTimeout": 120,
        },
      },
    });

    this.sessionId = value.sessionId;
  }

  async stop() {
    if (!this.sessionId) return;
    await this.request("DELETE", `/session/${this.sessionId}`);
    this.sessionId = undefined;
  }

  async url(path) {
    const url = path.startsWith("http") ? path : `${MOBILE_E2E_BASE_URL}${path}`;
    await this.request("POST", `/session/${this.sessionId}/url`, { url });
  }

  async execute(script, args = []) {
    return this.request("POST", `/session/${this.sessionId}/execute/sync`, {
      script,
      args,
    });
  }

  async clearBrowserStorage() {
    await this.execute("window.localStorage.clear(); window.sessionStorage.clear();");
  }

  async currentUrl() {
    return this.request("GET", `/session/${this.sessionId}/url`);
  }

  async find(selector) {
    return this.request("POST", `/session/${this.sessionId}/element`, {
      using: "css selector",
      value: selector,
    });
  }

  async findAll(selector) {
    return this.request("POST", `/session/${this.sessionId}/elements`, {
      using: "css selector",
      value: selector,
    });
  }

  async waitFor(selector, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    let lastError;

    while (Date.now() < deadline) {
      try {
        return await this.find(selector);
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    throw lastError ?? new Error(`Element not found: ${selector}`);
  }

  async click(selector) {
    const element = await this.waitFor(selector);
    await this.request("POST", `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/click`);
  }

  async type(selector, value) {
    const element = await this.waitFor(selector);
    await this.request("POST", `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/clear`);
    await this.request("POST", `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/value`, {
      text: value,
    });
  }

  async text(selector) {
    const element = await this.waitFor(selector);
    return this.request("GET", `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/text`);
  }

  async allText(selector) {
    const elements = await this.findAll(selector);
    return Promise.all(
      elements.map((element) =>
        this.request("GET", `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/text`),
      ),
    );
  }

  async expectUrlToMatch(pattern) {
    assert.match(await this.currentUrl(), pattern);
  }

  async waitForUrl(pattern, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    let current = "";

    while (Date.now() < deadline) {
      current = await this.currentUrl();
      if (pattern.test(current)) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    assert.match(current, pattern);
  }
}
