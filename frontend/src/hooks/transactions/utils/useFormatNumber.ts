
export function useFormatNumber(value: number): string {
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}