import { useMemo, useState } from "react";
import { useAllTransactions } from "../../hooks/transactions/useAllTransactions";
import { TransactionsHeader } from "./components/TransactionsHeader";
import { TransactionStats } from "./components/TransactionStats";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionList } from "./components/TransactionList";
import { byDateDesc, type TypeFilter } from "./transactions.utils";

export default function Transactions() {
  const transactionsQuery = useAllTransactions();
  const transactions = useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );

  const [tickerFilter, setTickerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasActiveFilters =
    tickerFilter !== "" || typeFilter !== "all" || dateFrom !== "" || dateTo !== "";

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (tickerFilter && !t.ticker.includes(tickerFilter)) return false;
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (dateFrom && new Date(t.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(t.date) > new Date(dateTo + "T23:59:59")) return false;
        return true;
      })
      .sort(byDateDesc);
  }, [transactions, tickerFilter, typeFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setTickerFilter("");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const buyCount = transactions.filter((t) => t.type === "BUY").length;
  const sellCount = transactions.filter((t) => t.type === "SELL").length;

  return (
    <div
      data-cy="transactions-page"
      data-testid="transactions-page"
      className="relative min-h-screen p-6 md:p-8 lg:p-12 text-[var(--text)] font-sans selection:bg-[var(--primary)]/30"
    >
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[120px]" />

      <TransactionsHeader />

      <TransactionStats
        total={transactions.length}
        buyCount={buyCount}
        sellCount={sellCount}
        isLoading={transactionsQuery.isLoading}
      />

      <TransactionFilters
        tickerFilter={tickerFilter}
        typeFilter={typeFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        resultCount={filtered.length}
        hasActiveFilters={hasActiveFilters}
        onTickerChange={setTickerFilter}
        onTypeChange={setTypeFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={clearFilters}
      />

      <div className="relative z-10">
        <TransactionList
          transactions={filtered}
          isLoading={transactionsQuery.isLoading}
          isError={transactionsQuery.isError}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </div>
  );
}