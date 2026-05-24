export function useErrorLabel(error: unknown): string | undefined {
    if (!error) return undefined;
    if (error instanceof Error) return error.message;
    return "No pudimos cargar los precios.";
}