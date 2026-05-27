describe("Watchlist Page", () => {
    const POST_WATCHLIST = "/api/watchlist";
    const POST_COMPARE   = "/api/watchlist/compare";
    const DEL_WATCHLIST  = (ticker: string) => `/api/watchlist/${ticker}`;

    beforeEach(() => {
        cy.loginAsUser();
        cy.visitWatchlist();
    });

    // ── Layout & header ───────────────────────────────────────────────────────

    it("renders the page header with the correct item count", () => {
        cy.get("[data-cy=watchlist-header]").should("be.visible");
        cy.get("[data-cy=watchlist-header]").should("contain.text", "3 empresas");
    });

    it("renders the add form and the watchlist table", () => {
        cy.get("[data-cy=add-ticker-form]").should("exist");
        cy.get("[data-cy=watchlist-table]").should("exist");
    });

    // ── Loading & error states ────────────────────────────────────────────────

    it("shows a loading indicator while the watchlist is being fetched", () => {
        cy.fixture("watchlist").then((wl) => {
            cy.intercept("GET", "/api/watchlist", (req) => {
                req.reply((res) => {
                    res.setDelay(400);
                    res.send({ statusCode: 200, body: wl.items });
                });
            }).as("slowWatchlist");

            cy.visit("/app/watchlist");
            cy.get("[data-cy=watchlist-loading]").should("be.visible");
            cy.wait("@slowWatchlist");
        });
    });

    it("shows an error banner when the watchlist fetch fails", () => {
        cy.intercept("GET", "/api/watchlist", { statusCode: 500 }).as("failWatchlist");
        cy.visit("/app/watchlist");
        cy.wait("@failWatchlist");
        cy.get("[data-cy=watchlist-error]").should("be.visible");
    });

    // ── Table rows ────────────────────────────────────────────────────────────

    it("renders one row per watchlist item", () => {
        cy.get("[data-cy=watchlist-row]").should("have.length", 3);
    });

    it("displays the price and positive change for items that have price data", () => {
        cy.get("[data-cy=watchlist-row]")
            .first()
            .within(() => {
                cy.get("[data-cy=item-price]").should("contain.text", "189.50");
                cy.get("[data-cy=item-change]").should("contain.text", "+1.23%");
            });
    });

    it("shows a negative change in red for a losing stock", () => {
        cy.get("[data-cy=watchlist-row]")
            .eq(1)
            .within(() => {
                cy.get("[data-cy=item-change]")
                    .should("contain.text", "-0.45%")
                    .and("have.class", "text-rose-400");
            });
    });

    it("shows 'Sin precio' for items without price data", () => {
        cy.get("[data-cy=watchlist-row]")
            .last()
            .within(() => {
                cy.get("[data-cy=item-no-price]").should("be.visible");
            });
    });

    // ── Empty state ───────────────────────────────────────────────────────────

    it("shows an empty state when the watchlist has no items", () => {
        cy.intercept("GET", "/api/watchlist", { statusCode: 200, body: [] }).as("emptyWatchlist");
        cy.visit("/app/watchlist");
        cy.wait("@emptyWatchlist");
        cy.get("[data-cy=watchlist-empty]").should("be.visible");
    });

    // ── Add ticker ────────────────────────────────────────────────────────────

    it("shows autocomplete suggestions while typing in the search input", () => {
        cy.get("[data-cy=ticker-input]").type("AA");
        cy.get("[data-cy=ticker-suggestions]").should("be.visible");
        cy.get("[data-cy=ticker-suggestion-item]").should("have.length.at.least", 1);
    });

    it("fills the input and triggers add when clicking a suggestion", () => {
        cy.fixture("watchlist").then((wl) => {
            cy.intercept("POST", POST_WATCHLIST, { statusCode: 200, body: wl.items[0] }).as("autoAdd");
        });
        cy.get("[data-cy=ticker-input]").type("AA");
        cy.get("[data-cy=ticker-suggestions]").should("be.visible");
        cy.get("[data-cy=ticker-suggestion-item]").first().click();
        cy.get("[data-cy=ticker-input]").should("be.visible").and("have.value", "AAPL");
    });

    it("adds a ticker successfully and shows the success message", () => {
        cy.fixture("watchlist").then((wl) => {
            cy.intercept("POST", POST_WATCHLIST, { statusCode: 200, body: wl.newItem }).as("addTicker");
        });
        cy.get("[data-cy=ticker-input]").type("TSLA");
        cy.get("[data-cy=add-ticker-btn]").click();
        cy.wait("@addTicker");
        cy.get("[data-cy=add-success]").should("be.visible");
    });

    it("shows an error when trying to add a duplicate ticker (409)", () => {
        cy.intercept("POST", POST_WATCHLIST, {
            statusCode: 409,
            body: { message: "already in watchlist" },
        }).as("addDuplicate");

        cy.get("[data-cy=ticker-input]").type("AAPL");
        cy.get("[data-cy=add-ticker-btn]").click();
        cy.wait("@addDuplicate");
        cy.get("[data-cy=add-error]")
            .should("be.visible")
            .and("contain.text", "ya está en tu watchlist");
    });

    it("shows an error when the ticker is not found (404)", () => {
        cy.intercept("POST", POST_WATCHLIST, {
            statusCode: 404,
            body: { message: "not found" },
        }).as("addNotFound");

        cy.get("[data-cy=ticker-input]").type("XXXX");
        cy.get("[data-cy=add-ticker-btn]").click();
        cy.wait("@addNotFound");
        cy.get("[data-cy=add-error]")
            .should("be.visible")
            .and("contain.text", "no encontrado");
    });

    it("shows an error when the watchlist is full (422)", () => {
        cy.intercept("POST", POST_WATCHLIST, {
            statusCode: 422,
            body: { message: "watchlist full" },
        }).as("addFull");

        cy.get("[data-cy=ticker-input]").type("NVDA");
        cy.get("[data-cy=add-ticker-btn]").click();
        cy.wait("@addFull");
        cy.get("[data-cy=add-error]")
            .should("be.visible")
            .and("contain.text", "máximo 20 empresas");
    });

    it("disables the add button while the add request is pending", () => {
        cy.intercept("POST", POST_WATCHLIST, (req) => {
            req.reply((res) => {
                res.setDelay(500);
                res.send({ statusCode: 200 });
            });
        }).as("slowAdd");

        cy.get("[data-cy=ticker-input]").type("TSLA");
        cy.get("[data-cy=add-ticker-btn]").click();
        cy.get("[data-cy=add-ticker-btn]").should("be.disabled");
        cy.wait("@slowAdd");
    });

    it("clears the input when clicking the clear (X) button", () => {
        cy.get("[data-cy=ticker-input]").type("AAPL");
        cy.get("button[aria-label='Limpiar búsqueda']").click();
        cy.get("[data-cy=ticker-input]").should("have.value", "");
    });

    // ── Remove ticker ─────────────────────────────────────────────────────────

    it("opens the confirmation dialog when clicking the remove button", () => {
        cy.get("[data-cy=remove-btn]").first().click();
        cy.get("[data-cy=remove-confirm-dialog]").should("be.visible");
        cy.get("[data-cy=remove-confirm-dialog]").should("contain.text", "AAPL");
    });

    it("closes the dialog without removing when clicking Cancel", () => {
        cy.get("[data-cy=remove-btn]").first().click();
        cy.get("[data-cy=remove-cancel-btn]").click();
        cy.get("[data-cy=remove-confirm-dialog]").should("not.exist");
        cy.get("[data-cy=watchlist-row]").should("have.length", 3);
    });

    it("removes the item after confirming in the dialog", () => {
        cy.fixture("watchlist").then((wl) => {
            cy.intercept("DELETE", DEL_WATCHLIST("AAPL"), { statusCode: 200 }).as("removeTicker");
            cy.intercept("GET", "/api/watchlist", {
                statusCode: 200,
                body: wl.items.slice(1),
            }).as("getWatchlistAfterRemove");
        });

        cy.get("[data-cy=remove-btn]").first().click();
        cy.get("[data-cy=remove-confirm-btn]").click();
        cy.wait("@removeTicker");
        cy.get("[data-cy=remove-confirm-dialog]").should("not.exist");
    });

    it("disables the confirm button while the remove request is pending", () => {
        cy.intercept("DELETE", DEL_WATCHLIST("AAPL"), (req) => {
            req.reply((res) => {
                res.setDelay(500);
                res.send({ statusCode: 200 });
            });
        }).as("slowRemove");

        cy.get("[data-cy=remove-btn]").first().click();
        cy.get("[data-cy=remove-confirm-btn]").click();
        cy.get("[data-cy=remove-confirm-btn]").should("be.disabled");
        cy.wait("@slowRemove");
    });

    // ── Tabs ──────────────────────────────────────────────────────────────────

    it("switches to the Compare tab when clicked", () => {
        cy.contains("Comparar").click();
        cy.get("[data-cy=compare-section]").should("be.visible");
        cy.get("[data-cy=watchlist-table]").should("not.exist");
    });

    it("switches back to the List tab from Compare", () => {
        cy.contains("Comparar").click();
        cy.contains("Lista").click();
        cy.get("[data-cy=watchlist-table]").should("be.visible");
    });

    // ── Compare ───────────────────────────────────────────────────────────────

    it("renders all ticker chips in the compare selector", () => {
        cy.contains("Comparar").click();
        cy.get("[data-cy=compare-ticker-chip]").should("have.length", 3);
    });

    it("disables the Compare button when fewer than 2 tickers are selected", () => {
        cy.contains("Comparar").click();
        cy.get("[data-cy=compare-btn]").should("be.disabled");

        cy.selectCompareChips("AAPL");
        cy.get("[data-cy=compare-btn]").should("be.disabled");
    });

    it("enables the Compare button when at least 2 tickers are selected", () => {
        cy.contains("Comparar").click();
        cy.selectCompareChips("AAPL", "MSFT");
        cy.get("[data-cy=compare-btn]").should("not.be.disabled");
    });

    it("shows the metrics table after a successful compare", () => {
        cy.fixture("watchlist").then((wl) => {
            cy.interceptCompare("compareMetrics", wl.metrics);
        });

        cy.contains("Comparar").click();
        cy.selectCompareChips("AAPL", "MSFT");
        cy.get("[data-cy=compare-btn]").click();
        cy.wait("@compareMetrics");

        cy.get("[data-cy=compare-table]").should("be.visible");
        cy.get("[data-cy=compare-col-header]").should("have.length", 2);
        cy.get("[data-cy=metric-value]").should("have.length.at.least", 1);
    });

    it("shows an error banner when the compare request fails", () => {
        cy.interceptCompare("compareError", 500);

        cy.contains("Comparar").click();
        cy.selectCompareChips("AAPL", "MSFT");
        cy.get("[data-cy=compare-btn]").click();
        cy.wait("@compareError");

        cy.get("[data-cy=compare-error]").should("be.visible");
    });

    it("shows 'no data' when all metrics are empty", () => {
        cy.fixture("watchlist").then((wl) => {
            const emptyMetrics = wl.metrics.map((r: object) => ({
                ...r,
                metrics: { revenue: [], netIncome: [], eps: [], totalAssets: [], totalLiabilities: [] },
            }));
            cy.interceptCompare("compareEmpty", emptyMetrics);
        });

        cy.contains("Comparar").click();
        cy.selectCompareChips("AAPL", "MSFT");
        cy.get("[data-cy=compare-btn]").click();
        cy.wait("@compareEmpty");

        cy.get("[data-cy=compare-no-data]").should("be.visible");
        cy.get("[data-cy=compare-table]").should("not.exist");
    });

    it("shows N/D for individual metrics with no data points", () => {
        cy.fixture("watchlist").then((wl) => {
            const partialMetrics = [
                { ...wl.metrics[0], metrics: { ...wl.metrics[0].metrics, eps: [] } },
                wl.metrics[1],
            ];
            cy.interceptCompare("comparePartial", partialMetrics);
        });

        cy.contains("Comparar").click();
        cy.selectCompareChips("AAPL", "MSFT");
        cy.get("[data-cy=compare-btn]").click();
        cy.wait("@comparePartial");

        cy.get("[data-cy=metric-nd]").should("exist");
    });

    it("shows the hint text before a compare is triggered", () => {
        cy.contains("Comparar").click();
        cy.get("[data-cy=compare-hint]").should("be.visible");
    });
});