export function extractMessageFromError(
    error: unknown,
    fallbackMessage: string = "An unknown error occurred"
): string {
    if (error instanceof Error) {
        return error.message;
    }
    return fallbackMessage;
}
