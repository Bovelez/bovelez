describe("Stock Detail Page", () => {
    beforeEach(() => {
        cy.loginAsUser();
    });

    // ── Not found ─────────────────────────────────────────────────────────────

    it("shows the not-found state for an unknown ticker", () => {
        cy.visitStock("ZZZZ");
        cy.get("[data-cy=stock-not-found]").should("be.visible");
    });

    it("navigates back when clicking 'Volver' on the not-found screen", () => {
        cy.visitStock("ZZZZ");
        cy.get("[data-cy=stock-not-found-back]").click();
        cy.url().should("not.include", "/stock/ZZZZ");
    });

    // ── Hero ──────────────────────────────────────────────────────────────────

    describe("with a valid ticker (AAPL)", () => {
        beforeEach(() => {
            cy.visitStock("AAPL");
        });

        it("renders the hero section", () => {
            cy.get("[data-cy=stock-hero]").should("be.visible");
        });

        it("shows the ticker badge in the hero", () => {
            cy.get("[data-cy=stock-ticker-badge]").should("contain.text", "AAPL");
        });

        it("shows the company name in the hero", () => {
            cy.get("[data-cy=stock-company-name]").should("contain.text", "Apple");
        });

        it("shows the current price in the hero", () => {
            cy.get("[data-cy=stock-price]").invoke("text").should("match", /\$[\d,.]+/);
        });

        // ── Quick Action ──────────────────────────────────────────────────────

        it("renders the quick action panel", () => {
            cy.get("[data-cy=quick-action]").should("be.visible");
        });

        it("shows the price in the quick action panel", () => {
            cy.get("[data-cy=quick-action-price]").invoke("text").should("match", /\$[\d,.]+|—/);
        });

        it("quantity starts at 1 and increments/decrements correctly", () => {
            cy.get("[data-cy=qty-value]").should("have.text", "1");
            cy.get("[data-cy=qty-increase]").click();
            cy.get("[data-cy=qty-value]").should("have.text", "2");
            cy.get("[data-cy=qty-decrease]").click();
            cy.get("[data-cy=qty-value]").should("have.text", "1");
        });

        it("does not decrement quantity below 1", () => {
            cy.get("[data-cy=qty-decrease]").click();
            cy.get("[data-cy=qty-value]").should("have.text", "1");
        });

        it("'Comprar' button navigates to the buy flow", () => {
            cy.get("[data-cy=buy-btn]").click();
            cy.url().should("include", "/app/buy/AAPL");
        });

        it("'Vender' button navigates to the sell flow", () => {
            cy.visitStock("AAPL");
            cy.get("[data-cy=sell-btn]").click();
            cy.url().should("include", "/app/sell/AAPL");
        });

        it("watchlist toggle button is visible", () => {
            cy.visitStock("AAPL");
            cy.get("[data-cy=watchlist-toggle]").should("be.visible");
        });

        // ── Sidebar ───────────────────────────────────────────────────────────

        it("renders the info sidebar", () => {
            cy.get("[data-cy=stock-info-sidebar]").should("be.visible");
        });

        // ── Tabs ──────────────────────────────────────────────────────────────

        it("renders the three tabs", () => {
            cy.get("[data-cy=stock-tabs]").within(() => {
                cy.get("[data-cy='stock-tab-métricas']").should("be.visible");
                cy.get("[data-cy='stock-tab-filings-sec']").should("be.visible");
                cy.get("[data-cy='stock-tab-trimestres']").should("be.visible");
            });
        });

        it("shows Métricas tab by default", () => {
            cy.get("[data-cy=metricas-tab], [data-cy=metricas-error]").should("exist");
        });

        it("switches to Filings SEC tab", () => {
            cy.get("[data-cy='stock-tab-filings-sec']").click();
            cy.get("[data-cy=filings-tab]").should("be.visible");
        });

        it("switches to Trimestres tab", () => {
            cy.get("[data-cy='stock-tab-trimestres']").click();
            cy.get("[data-cy=trimestres-tab], [data-cy=trimestres-no-data]").should("exist");
        });

        // ── Métricas tab ──────────────────────────────────────────────────────

        it("renders metric cards when data is available", () => {
            cy.get("[data-cy=metricas-tab]").then(($el) => {
                if ($el.length) {
                    cy.get("[data-cy=metric-card]").should("have.length", 5);
                }
            });
        });

        // ── Filings tab ───────────────────────────────────────────────────────

        it("shows filings rows or empty state", () => {
            cy.get("[data-cy='stock-tab-filings-sec']").click();
            cy.get("[data-cy=filing-row], [data-cy=filings-empty]").should("exist");
        });

        // ── Trimestres tab ────────────────────────────────────────────────────

        it("renders the view option buttons in Trimestres tab", () => {
            cy.get("[data-cy='stock-tab-trimestres']").click();
            cy.get("[data-cy=trimestres-tab]").then(($el) => {
                if ($el.length) {
                    cy.get("[data-cy^=trimestres-view-btn]").should("have.length", 4);
                }
            });
        });

        it("switches chart view in Trimestres tab", () => {
            cy.get("[data-cy='stock-tab-trimestres']").click();
            cy.get("[data-cy=trimestres-tab]").then(($el) => {
                if ($el.length) {
                    cy.get("[data-cy=trimestres-view-btn-eps]").click();
                    cy.get("[data-cy=trimestres-view-btn-eps]").should("have.css", "color", "rgb(255, 255, 255)");
                }
            });
        });
    });
});
