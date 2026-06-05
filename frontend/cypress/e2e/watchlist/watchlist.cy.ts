describe("Watchlist - E2E flows", () => {
    beforeEach(() => {
        cy.loginAsUser();
        cy.visit("/app/watchlist");
    });

    it("adds a ticker from the watchlist page and it appears in the list", () => {
        cy.ensureNotInWatchlist("TSLA");
        cy.visitWatchlist();

        cy.get("[data-cy=ticker-input]").type("TSLA");
        cy.get("[data-cy=add-ticker-btn]").click();

        cy.get("[data-cy=add-success]", { timeout: 8000 }).should("be.visible");
        cy.get("[data-cy=watchlist-row]").contains("TSLA").should("exist");
    });

    it("removes a ticker and it disappears from the list", () => {
        cy.ensureInWatchlist("AAPL");
        cy.ensureInWatchlist("TSLA");
        cy.visitWatchlist();

        cy.get("[data-cy=watchlist-row]").contains("TSLA").parents("[data-cy=watchlist-row]").find("[data-cy=remove-btn]").click();
        cy.get("[data-cy=remove-confirm-btn]").click();

        cy.get("[data-cy=watchlist-row]").contains("TSLA").should("not.exist");
    });

    it("adds a ticker to the watchlist from the stock detail page", () => {
        cy.visitStock("TSLA");

        cy.get("[data-cy=watchlist-toggle]")
            .should("be.visible")
            .and("not.contain.text", "En Watchlist");

        cy.get("[data-cy=watchlist-toggle]").click();
        cy.get("[data-cy=watchlist-toggle]", { timeout: 8000 })
            .should("contain.text", "En Watchlist");

        cy.visitWatchlist();
        cy.get("[data-cy=watchlist-row]").contains("TSLA").should("exist");
    });

    it("compara dos tickers y muestra la tabla de métricas", () => {
        cy.ensureInWatchlist("AAPL");
        cy.ensureInWatchlist("MSFT");
        cy.visitWatchlist();

        cy.contains("Comparar").click();
        cy.get("[data-cy=compare-section]").should("be.visible");

        cy.selectCompareChips("AAPL", "MSFT");
        cy.get("[data-cy=compare-btn]").should("not.be.disabled").click();

        cy.get("[data-cy=compare-table]", { timeout: 10000 }).should("be.visible");
        cy.get("[data-cy=compare-col-header]").should("have.length", 2);
        cy.get("[data-cy=metric-value]").should("have.length.at.least", 1);
    });
});
