describe("Portfolio - E2E flows", () => {
    beforeEach(() => {
        cy.loginAsUser();
        cy.visitPortfolio();
    });

    it("buys shares and the new position appears in the portfolio", () => {
        cy.get("[data-cy=ticker-search]").type("TSLA");
        cy.get("[data-cy=ticker-row][data-ticker=TSLA]").click();
        cy.get("[data-cy=transaction-quantity]").clear().type("3");
        cy.get("[data-cy=transaction-buy-btn]").click();

        cy.get("[data-cy=transaction-success]", { timeout: 10000 })
            .should("be.visible")
            .and("contain.text", "Compra");

        cy.get("[data-cy=position-row]")
            .contains("[data-cy=position-ticker]", "TSLA")
            .should("exist");
    });

    it("sells all shares and the position disappears from the portfolio", () => {
        cy.get("[data-cy=ticker-search]").type("TSLA");
        cy.get("[data-cy=ticker-row][data-ticker=TSLA]").click();
        cy.get("[data-cy=transaction-quantity]").clear().type("3");
        cy.get("[data-cy=transaction-buy-btn]").click();

        cy.get("[data-cy=transaction-success]", { timeout: 10000 })
            .should("be.visible")
            .and("contain.text", "Compra");

        cy.get("[data-cy=position-row]")
            .contains("[data-cy=position-ticker]", "TSLA")
            .parents("[data-cy=position-row]")
            .click();

        cy.get("[data-cy=ticker-dialog]").within(() => {
            cy.get("[data-cy=ticker-dialog-sell-quantity]").clear().type("3");
            cy.get("[data-cy=ticker-dialog-sell-btn]").should("not.be.disabled").click();
            cy.get("[data-cy=ticker-dialog-sell-success]", { timeout: 10000 }).should("be.visible");
        });

        cy.get("[data-cy=ticker-dialog-close]").click();
        cy.visitPortfolio();

        cy.get("[data-cy=active-shares]").should("not.contain.text", "TSLA");
    });

    it("shows the correct success message when selling from the transaction panel", () => {
        cy.get("[data-cy=ticker-search]").type("MSFT");
        cy.get("[data-cy=ticker-row][data-ticker=MSFT]").click();
        cy.get("[data-cy=transaction-quantity]").clear().type("2");
        cy.get("[data-cy=transaction-buy-btn]").click();

        cy.get("[data-cy=transaction-success]", { timeout: 10000 })
            .should("be.visible")
            .and("contain.text", "Compra");

        cy.get("[data-cy=transaction-quantity]").clear().type("1");
        cy.get("[data-cy=transaction-sell-btn]").click();

        cy.get("[data-cy=transaction-success]", { timeout: 10000 })
            .should("be.visible")
            .and("contain.text", "Venta")
            .and("not.contain.text", "Compra");
    });

    it("buy and sell transactions appear in the transactions page", () => {
        cy.get("[data-cy=ticker-search]").type("AAPL");
        cy.get("[data-cy=ticker-row][data-ticker=AAPL]").click();
        cy.get("[data-cy=transaction-quantity]").clear().type("2");
        cy.get("[data-cy=transaction-buy-btn]").click();
        cy.get("[data-cy=transaction-success]", { timeout: 10000 }).should("be.visible");

        cy.get("[data-cy=position-row]")
            .contains("[data-cy=position-ticker]", "AAPL")
            .parents("[data-cy=position-row]")
            .click();

        cy.get("[data-cy=ticker-dialog]").within(() => {
            cy.get("[data-cy=ticker-dialog-sell-quantity]").clear().type("1");
            cy.get("[data-cy=ticker-dialog-sell-btn]").should("not.be.disabled").click();
            cy.get("[data-cy=ticker-dialog-sell-success]", { timeout: 10000 }).should("be.visible");
        });
        cy.get("[data-cy=ticker-dialog-close]").click();

        cy.visit("/app/transactions");
        cy.get("[data-cy=transaction-row]", { timeout: 8000 }).should("have.length.at.least", 1);

        cy.get("[data-cy=filter-ticker]").type("AAPL");
        cy.get("[data-cy=filter-type]").select("BUY");
        cy.get("[data-cy=transaction-row]")
            .first()
            .find("[data-cy=transaction-row-ticker]")
            .should("have.text", "AAPL");

        cy.get("[data-cy=filter-type]").select("SELL");
        cy.get("[data-cy=transaction-row]")
            .first()
            .find("[data-cy=transaction-row-ticker]")
            .should("have.text", "AAPL");
    });

    it("buying shares makes the position appear on the dashboard", () => {
        cy.get("[data-cy=ticker-search]").type("AAPL");
        cy.get("[data-cy=ticker-row][data-ticker=AAPL]").click();
        cy.get("[data-cy=transaction-quantity]").clear().type("1");
        cy.get("[data-cy=transaction-buy-btn]").click();
        cy.get("[data-cy=transaction-success]", { timeout: 10000 }).should("be.visible");

        cy.visitDashboard();

        cy.get("[data-cy=portfolio-table]").should("be.visible");
        cy.get("[data-cy=portfolio-row]")
            .contains("[data-cy=portfolio-row-ticker]", "AAPL")
            .should("exist");

        cy.get("[data-cy=dashboard-recent-transactions]").should("be.visible");
        cy.get("[data-cy=transaction-row]")
            .first()
            .find("[data-cy=transaction-ticker]")
            .should("have.text", "AAPL");
    });

    it("account total value increases after buying more shares", () => {
        cy.get("[data-cy=portfolio-total-value]")
            .should("not.contain.text", "···")
            .invoke("text")
            .then((beforeText) => {
                const before = parseFloat(beforeText.replace(/[$,]/g, ""));

                cy.get("[data-cy=ticker-search]").type("AAPL");
                cy.get("[data-cy=ticker-row][data-ticker=AAPL]").click();
                cy.get("[data-cy=transaction-quantity]").clear().type("10");
                cy.get("[data-cy=transaction-buy-btn]").click();
                cy.get("[data-cy=transaction-success]", { timeout: 10000 }).should("be.visible");

                cy.visitPortfolio();
                cy.get("[data-cy=portfolio-total-value]")
                    .should("not.contain.text", "···")
                    .invoke("text")
                    .then((afterText) => {
                        const after = parseFloat(afterText.replace(/[$,]/g, ""));
                        expect(after).to.be.greaterThan(before);
                    });
            });
    });
});
