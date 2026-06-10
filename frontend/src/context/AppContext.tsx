import { useState, useEffect, type ReactNode } from "react";
import { AppContext } from "./app-context";

function formatUpdateTime(date: Date): string {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string>(
    formatUpdateTime(new Date()),
  );

  const refreshPrices = () => {
    // Mock: simula una actualización de precios
    setLastPriceUpdate(formatUpdateTime(new Date()));
  };

  // Mock: auto-refresh cada 5 minutos
  useEffect(() => {
    const id = setInterval(refreshPrices, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AppContext.Provider value={{ lastPriceUpdate, refreshPrices }}>
      {children}
    </AppContext.Provider>
  );
}
