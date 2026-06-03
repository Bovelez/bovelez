declare global {
    namespace Cypress {
        interface Chainable {
            getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
            resetDb(): void;
            fillLoginForm(email: string, password: string): void;
            fillRegisterForm(fields: {
                nombre: string;
                email: string;
                password: string;
                confirmPassword?: string;
                acceptTerms?: boolean;
            }): void;
            shouldHaveFieldErrors(): void;
            shouldHaveGlobalError(): void;
            loginAsUser(): void;
            visitWatchlist(): void;
            interceptCompare(alias: string, response: object | number): void;
            selectCompareChips(...tickers: string[]): void;
        }
    }
}
export {};