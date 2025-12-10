/**
 * Formats a string into a French SIV license plate format (AA-123-BB).
 * Automatically uppercases and inserts hyphens.
 */
export const formatPlate = (text: string): string => {
    // 1. Remove non-alphanumeric characters and uppercase
    const clean = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // 2. Format as SIV (XX-123-XX)
    // We construct the string character by character or chunks

    if (clean.length === 0) return '';

    // First group: 2 letters
    if (clean.length <= 2) {
        return clean;
    }

    // Second group: 3 digits
    if (clean.length <= 5) {
        return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    }

    // Third group: 2 letters (max 7 chars total)
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5, 7)}`;
};
