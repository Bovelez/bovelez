describe("Dashboard Page", () => {
    beforeEach(() => {
        cy.loginAsUser();
        cy.visitDashboard();
    });

    // ── Layout ────────────────────────────────────────────────────────────────

    it("renders the main dashboard container", () => {
        cy.get("[data-cy=dashboard]").should("be.visible");
    });

    // ── Header ────────────────────────────────────────────────────────────────

    it("shows the total portfolio value after loading", () => {
        cy.get("[data-cy=dashboard-total-value]")
            .should("not.contain.text", "···")
            .and("contain.text", "$");
    });

    it("shows the PnL badges", () => {
        cy.get("[data-cy=dashboard-pnl]").should("be.visible");
        cy.get("[data-cy=dashboard-pnl-percent]").should("be.visible");
    });

    it("displays the last update widget", () => {
        cy.get("[data-cy=dashboard-last-update]").should("be.visible");
    });

    // ── Últimas transacciones ─────────────────────────────────────────────────

    it("renders the recent transactions panel", () => {
        cy.get("[data-cy=dashboard-recent-transactions]").should("be.visible");
    });

    it("shows at most 5 transaction rows", () => {
        cy.get("[data-cy=transaction-row]").should("have.length.at.most", 5);
    });

    it("each transaction row shows a ticker and a type label", () => {
        cy.get("[data-cy=transaction-row]").first().within(() => {
            cy.get("[data-cy=transaction-ticker]").should("not.be.empty");
            cy.get("[data-cy=transaction-type]")
                .invoke("text")
                .should("match", /Compra|Venta/);
        });
    });

    it("navigates to /app/transactions when clicking 'Ver todas'", () => {
        cy.get("[data-cy=dashboard-view-all-transactions]").click();
        cy.url().should("include", "/app/transactions");
    });

    // ── Asignación ────────────────────────────────────────────────────────────

    it("renders the allocation chart section", () => {
        cy.get("[data-cy=dashboard-allocation-chart]").should("be.visible");
    });

    it("shows the pie chart and legend when there are positions", () => {
        cy.get("[data-cy=allocation-pie]").should("exist");
        cy.get("[data-cy=allocation-legend-item]").should("have.length.at.least", 1);
    });

    it("each legend item shows a ticker and a percentage", () => {
        cy.get("[data-cy=allocation-legend-item]").first().within(() => {
            cy.get("[data-cy=allocation-ticker]").should("not.be.empty");
            cy.get("[data-cy=allocation-percent]").invoke("text").should("match", /\d+%/);
        });
    });

    // ── Tabla de activos ──────────────────────────────────────────────────────

    it("renders the portfolio table", () => {
        cy.get("[data-cy=portfolio-table]").should("be.visible");
    });

    it("shows at least one portfolio row", () => {
        cy.get("[data-cy=portfolio-row]").should("have.length.at.least", 1);
    });

    it("each portfolio row shows a ticker and a price", () => {
        cy.get("[data-cy=portfolio-row]").first().within(() => {
            cy.get("[data-cy=portfolio-row-ticker]").should("not.be.empty");
            cy.get("[data-cy=portfolio-row-price]").invoke("text").should("match", /\$[\d,.]+|—/);
        });
    });

    it("navigates to /app/portfolio when clicking 'Agregar Transacción'", () => {
        cy.get("[data-cy=dashboard-add-transaction]").click();
        cy.url().should("include", "/app/portfolio");
    });

    it("navigates to the stock detail page when clicking a portfolio row", () => {
        cy.get("[data-cy=portfolio-row]").first().click();
        cy.url().should("match", /\/app\/stock\/.+/);
    });
});
