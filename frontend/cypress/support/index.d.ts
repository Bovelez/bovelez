declare global {
    namespace Cypress {
        interface Chainable {
            getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

            fillLoginForm(
                email: string,
                password: string,
                intercept?: boolean
            ): void;

            fillRegisterForm(
                fields: {
                    nombre: string;
                    email: string;
                    password: string;
                    confirmPassword?: string;
                    acceptTerms?: boolean;
                },
                intercept?: boolean
            ): void;

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