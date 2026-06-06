export class AuthScreen {
  constructor(app) {
    this.app = app;
  }

  async openRegister() {
    await this.app.url('/register');
  }

  async openLogin() {
    await this.app.url('/login');
  }

  async resetOnRegister() {
    await this.openRegister();
    await this.app.clearBrowserStorage();
    await this.openRegister();
  }

  async resetOnLogin() {
    await this.openLogin();
    await this.app.clearBrowserStorage();
    await this.openLogin();
  }

  async register({ name, email, password, confirmPassword = password }) {
    await this.app.type('[data-testid="name-input"]', name);
    await this.app.type('[data-testid="email-input"]', email);
    await this.app.type('[data-testid="password-input"]', password);
    await this.app.type(
      '[data-testid="confirm-password-input"]',
      confirmPassword,
    );
    await this.app.domClick('[data-testid="submit-btn"]');
  }

  async login(email, password) {
    await this.app.type('[data-testid="email-input"]', email);
    await this.app.type('[data-testid="password-input"]', password);
    await this.app.domClick('[data-testid="submit-btn"]');
  }

  async globalErrorText() {
    return this.app.text('[data-testid="global-error"]');
  }
}
