describe("Stock - E2E flows", () => {
    beforeEach(() => {
        cy.loginAsUser();
    });

    it("navega entre los tabs y muestra contenido en cada uno", () => {
        cy.visitStock("AAPL");

        cy.get("[data-cy='stock-tab-métricas']").click();
        cy.get("[data-cy=metricas-tab], [data-cy=metricas-error]", { timeout: 8000 }).should("exist");
        cy.get("[data-cy=metricas-tab]").then(($el) => {
            if ($el.length) cy.get("[data-cy=metric-card]").should("have.length", 5);
        });
        cy.get("[data-cy='stock-tab-filings-sec']").click();
        cy.get("[data-cy=filings-tab]", { timeout: 8000 }).should("be.visible");
        cy.get("[data-cy=filing-row], [data-cy=filings-empty]").should("exist");
        cy.get("[data-cy='stock-tab-trimestres']").click();
        cy.get("[data-cy=trimestres-tab], [data-cy=trimestres-no-data]", { timeout: 8000 }).should("exist");
    });

    it("compra desde la página de stock y la posición aparece en el portfolio", () => {
        cy.visitStock("AAPL");

        cy.get("[data-cy=buy-btn]").click();
        cy.url().should("include", "/app/buy/AAPL");

        cy.contains("Confirmar compra").click();

        cy.contains("Compra registrada", { timeout: 10000 }).should("be.visible");

        cy.contains("Ver portfolio").click();
        cy.url().should("include", "/app/portfolio");

        cy.get("[data-cy=position-row]")
            .contains("[data-cy=position-ticker]", "AAPL")
            .should("exist");
    });

    it("vende desde la página de stock y la transacción queda registrada", () => {
        cy.visitStock("AAPL");
        cy.get("[data-cy=buy-btn]").click();
        cy.contains("Confirmar compra").click();
        cy.contains("Compra registrada", { timeout: 10000 }).should("be.visible");
        cy.visitStock("AAPL");
        cy.get("[data-cy=buy-btn]").click();
        cy.contains("Confirmar compra").click();
        cy.contains("Compra registrada", { timeout: 10000 }).should("be.visible");

        cy.visitStock("AAPL");
        cy.get("[data-cy=sell-btn]").click();
        cy.url().should("include", "/app/sell/AAPL");

        cy.contains("Confirmar venta").click();

        cy.contains("Venta registrada", { timeout: 10000 }).should("be.visible");
        cy.visit("/app/transactions");
        cy.get("[data-cy=filter-ticker]").type("AAPL");
        cy.get("[data-cy=filter-type]").select("SELL");
        cy.get("[data-cy=transaction-row]", { timeout: 8000 }).should("have.length.at.least", 1);
    });
});
