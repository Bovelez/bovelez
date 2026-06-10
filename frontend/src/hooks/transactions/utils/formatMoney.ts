
export function formatMoney(value: number | null | undefined): string {
    if (value === null || value === undefined) return "—";
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}