describe("Transactions Page", () => {
    beforeEach(() => {
        cy.loginAsUser();
        cy.visitTransactions();
    });

    // ── Layout ────────────────────────────────────────────────────────────────

    it("renders the transactions page", () => {
        cy.get("[data-cy=transactions-page]").should("be.visible");
    });

    // ── Stats ─────────────────────────────────────────────────────────────────

    it("renders the stats cards", () => {
        cy.get("[data-cy=transaction-stats]").should("be.visible");
        cy.get("[data-cy=stat-total]").should("exist");
        cy.get("[data-cy=stat-buys]").should("exist");
        cy.get("[data-cy=stat-sells]").should("exist");
    });

    it("shows correct total, buy and sell counts", () => {
        cy.get("[data-cy=stat-total-value]").invoke("text").then((total) => {
            const t = parseInt(total);
            cy.get("[data-cy=stat-buys-value]").invoke("text").then((buys) => {
                cy.get("[data-cy=stat-sells-value]").invoke("text").then((sells) => {
                    expect(parseInt(buys) + parseInt(sells)).to.eq(t);
                });
            });
        });
    });

    // ── List ──────────────────────────────────────────────────────────────────

    it("renders the transaction list", () => {
        cy.get("[data-cy=transactions-list]").should("exist");
    });

    it("shows at least one transaction row", () => {
        cy.get("[data-cy=transaction-row]").should("have.length.at.least", 1);
    });

    it("each row shows ticker, type, date and total", () => {
        cy.get("[data-cy=transaction-row]").first().within(() => {
            cy.get("[data-cy=transaction-row-ticker]").should("not.be.empty");
            cy.get("[data-cy=transaction-row-type]").invoke("text").should("match", /Compra|Venta/);
            cy.get("[data-cy=transaction-row-date]").should("not.be.empty");
            cy.get("[data-cy=transaction-row-total]").invoke("text").should("match", /\$[\d,.]+/);
        });
    });

    // ── Filtros ───────────────────────────────────────────────────────────────

    it("renders the filter panel", () => {
        cy.get("[data-cy=transaction-filters]").should("be.visible");
    });

    it("filters by ticker and shows only matching rows", () => {
        cy.get("[data-cy=filter-ticker]").type("AAPL");
        cy.get("[data-cy=transaction-row]").each(($row) => {
            cy.wrap($row).find("[data-cy=transaction-row-ticker]").should("have.text", "AAPL");
        });
    });

    it("shows result count matching the number of rows", () => {
        cy.get("[data-cy=filter-ticker]").type("AAPL");
        cy.get("[data-cy=transaction-row]").its("length").then((rowCount) => {
            cy.get("[data-cy=filter-result-count]").should("contain.text", rowCount.toString());
        });
    });

    it("filters by type BUY and shows only compras", () => {
        cy.get("[data-cy=filter-type]").select("BUY");
        cy.get("[data-cy=transaction-row]").each(($row) => {
            cy.wrap($row).find("[data-cy=transaction-row-type]").should("have.text", "Compra");
        });
    });

    it("filters by type SELL and shows only ventas", () => {
        cy.get("[data-cy=filter-type]").select("SELL");
        cy.get("[data-cy=transaction-row]").each(($row) => {
            cy.wrap($row).find("[data-cy=transaction-row-type]").should("have.text", "Venta");
        });
    });

    it("shows empty state when no rows match the filter", () => {
        cy.get("[data-cy=filter-ticker]").type("ZZZZ");
        cy.get("[data-cy=transactions-list-empty]").should("be.visible");
        cy.get("[data-cy=transaction-row]").should("not.exist");
    });

    it("shows the clear button when a filter is active", () => {
        cy.get("[data-cy=filter-clear]").should("not.exist");
        cy.get("[data-cy=filter-ticker]").type("AAPL");
        cy.get("[data-cy=filter-clear]").should("be.visible");
    });

    it("clears all filters when clicking Limpiar", () => {
        cy.get("[data-cy=filter-ticker]").type("AAPL");
        cy.get("[data-cy=filter-type]").select("BUY");
        cy.get("[data-cy=filter-clear]").click();
        cy.get("[data-cy=filter-ticker]").should("have.value", "");
        cy.get("[data-cy=filter-type]").should("have.value", "all");
        cy.get("[data-cy=filter-clear]").should("not.exist");
    });

    it("filters by date range and shows only matching rows", () => {
        cy.get("[data-cy=filter-date-from]").type("2025-01-09");
        cy.get("[data-cy=filter-date-to]").type("2025-01-11");
        // Con el seed: solo tx-1 (AAPL BUY, 2025-01-10) entra en ese rango
        cy.get("[data-cy=transaction-row]").should("have.length", 1);
        cy.get("[data-cy=transaction-row-ticker]").should("have.text", "AAPL");
    });
});
