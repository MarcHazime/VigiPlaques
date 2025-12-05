import Tesseract from 'tesseract.js';

export const extractPlateFromImage = async (imageBuffer: Buffer): Promise<string | null> => {
    try {
        const { data: { text } } = await Tesseract.recognize(
            imageBuffer,
            'eng', // Using English as it handles alphanumeric well
            { logger: m => console.log(m) }
        );

        console.log('OCR Text:', text);

        // Clean text: remove non-alphanumeric except dashes and spaces
        const cleanText = text.replace(/[^a-zA-Z0-9\-\s]/g, '').toUpperCase();

        // Regex for French SIV (AA-123-BB) and FNI (1234 AB 56)
        // We look for patterns that might have spaces or dashes
        // SIV: 2 letters, 3 digits, 2 letters
        const sivRegex = /([A-Z]{2})[- ]?([0-9]{3})[- ]?([A-Z]{2})/g;

        const matches = cleanText.match(sivRegex);

        if (matches && matches.length > 0) {
            // Return the first match, formatted with dashes
            const match = matches[0];
            // Normalize to AA-123-BB format
            return match.replace(/[\s]/g, '-').replace(/--/g, '-');
        }

        return null;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to process image');
    }
};
