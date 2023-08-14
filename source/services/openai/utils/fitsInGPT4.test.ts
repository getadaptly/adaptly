import { fitsInGPT4 } from './fitsInGPT4';

describe('fitsInGPT4', () => {
    it('should return true for content with less than 8192 tokens', () => {
        const content = 'This is a short string.';
        expect(fitsInGPT4(content)).toBe(true);
    });

    it('should return true for content with exactly 8191 tokens', () => {
        const content = 'a '.repeat(8190) + 'a';
        expect(fitsInGPT4(content)).toBe(true);
    });

    it('should return false for content with more than 8191 tokens', () => {
        const content = 'a '.repeat(8191) + 'a';
        expect(fitsInGPT4(content)).toBe(false);
    });

    it('should return true for empty content', () => {
        expect(fitsInGPT4('')).toBe(true);
    });

    // Add other edge cases or specific scenarios you want to test
});
