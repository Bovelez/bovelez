import assert from 'node:assert/strict';

const APPIUM_SERVER_URL = process.env.APPIUM_SERVER_URL;
const DEVICE_NAME = process.env.APPIUM_DEVICE_NAME;

export const MOBILE_E2E_BASE_URL = process.env.MOBILE_E2E_BASE_URL;

export const ELEMENT_ID = 'element-6066-11e4-a52e-4f735466cecf';

function isStaleElementError(error) {
  return error instanceof Error && error.message.includes('stale element');
}

export class AppiumBrowser {
  sessionId;

  async request(method, path, body) {
    const response = await fetch(`${APPIUM_SERVER_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const value = await this.request('POST', '/session', {
      capabilities: {
        alwaysMatch: {
          platformName: 'Android',
          browserName: 'Chrome',
          'appium:automationName': 'UiAutomator2',
          'appium:deviceName': DEVICE_NAME,
          'appium:chromedriverAutodownload': true,
          'appium:newCommandTimeout': 120,
        },
      },
    });

    this.sessionId = value.sessionId;
  }

  async stop() {
    if (!this.sessionId) return;
    await this.request('DELETE', `/session/${this.sessionId}`);
    this.sessionId = undefined;
  }

  async url(path) {
    const url = path.startsWith('http')
      ? path
      : `${MOBILE_E2E_BASE_URL}${path}`;
    await this.request('POST', `/session/${this.sessionId}/url`, { url });
  }

  async execute(script, args = []) {
    return this.request('POST', `/session/${this.sessionId}/execute/sync`, {
      script,
      args,
    });
  }

  async clearBrowserStorage() {
    await this.execute(
      'window.localStorage.clear(); window.sessionStorage.clear();',
    );
  }

  async currentUrl() {
    return this.request('GET', `/session/${this.sessionId}/url`);
  }

  async find(selector) {
    return this.request('POST', `/session/${this.sessionId}/element`, {
      using: 'css selector',
      value: selector,
    });
  }

  async findAll(selector) {
    return this.request('POST', `/session/${this.sessionId}/elements`, {
      using: 'css selector',
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

  async waitForAny(selectors, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    let lastError;

    while (Date.now() < deadline) {
      for (const selector of selectors) {
        try {
          return { selector, element: await this.find(selector) };
        } catch (error) {
          lastError = error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw lastError ?? new Error(`Elements not found: ${selectors.join(', ')}`);
  }

  async scrollIntoView(selector) {
    await this.execute(
      "document.querySelector(arguments[0])?.scrollIntoView({ block: 'center', inline: 'center' });",
      [selector],
    );
  }

  async blurActiveElement() {
    await this.execute('document.activeElement?.blur();');
  }

  async click(selector) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.blurActiveElement();
        await this.scrollIntoView(selector);
        const element = await this.waitFor(selector);
        await this.request(
          'POST',
          `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/click`,
        );
        return;
      } catch (error) {
        if (!isStaleElementError(error) || attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }

  async domClick(selector) {
    await this.blurActiveElement();
    await this.scrollIntoView(selector);
    await this.waitFor(selector);
    await this.execute('document.querySelector(arguments[0])?.click();', [
      selector,
    ]);
  }

  async waitForEnabled(selector, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    let disabled = true;

    while (Date.now() < deadline) {
      await this.waitFor(selector);
      disabled = await this.execute(
        'return Boolean(document.querySelector(arguments[0])?.disabled);',
        [selector],
      );
      if (!disabled) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    assert.equal(disabled, false, `${selector} stayed disabled`);
  }

  async type(selector, value) {
    await this.scrollIntoView(selector);
    const element = await this.waitFor(selector);
    await this.request(
      'POST',
      `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/clear`,
    );
    await this.request(
      'POST',
      `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/value`,
      {
        text: value,
      },
    );
  }

  async select(selector, value) {
    await this.scrollIntoView(selector);
    await this.waitFor(selector);
    await this.execute(
      "const el = document.querySelector(arguments[0]); el.value = arguments[1]; el.dispatchEvent(new Event('change', { bubbles: true }));",
      [selector, value],
    );
  }

  async text(selector) {
    const element = await this.waitFor(selector);
    return this.request(
      'GET',
      `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/text`,
    );
  }

  async allText(selector) {
    const elements = await this.findAll(selector);
    return Promise.all(
      elements.map((element) =>
        this.request(
          'GET',
          `/session/${this.sessionId}/element/${element[ELEMENT_ID]}/text`,
        ),
      ),
    );
  }

  async pageText() {
    return this.execute('return document.body.innerText;');
  }

  async count(selector) {
    return (await this.findAll(selector)).length;
  }

  async exists(selector) {
    return (await this.count(selector)) > 0;
  }

  async waitForText(pattern, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    let current = '';

    while (Date.now() < deadline) {
      current = await this.pageText();
      if (pattern.test(current)) return current;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    assert.match(current, pattern);
  }

  async waitForGone(selector, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (!(await this.exists(selector))) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    assert.equal(await this.count(selector), 0);
  }

  async expectUrlToMatch(pattern) {
    assert.match(await this.currentUrl(), pattern);
  }

  async waitForUrl(pattern, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    let current = '';

    while (Date.now() < deadline) {
      current = await this.currentUrl();
      if (pattern.test(current)) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const pageText = await this.pageText().catch(() => '');
    assert.match(
      current,
      pattern,
      `Expected URL to match ${pattern}, got ${current}. Page text: ${pageText}`,
    );
  }
}
