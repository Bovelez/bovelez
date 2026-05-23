
export function useNumberValue(value: number): string {
    return value.toLocaleString("en-US", {
        maximumFractionDigits: 4,
    });
}