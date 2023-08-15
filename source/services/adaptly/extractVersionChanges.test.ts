import { extractVersionChanges } from './extractVersionChanges';

describe('extractVersionChanges', () => {
    const changelog = `
    # Changelog
    ## 1.0.44
    Added a set_timeout method to the Client class in the Python SDK

    ## 1.0.43
    Added a setTimeout method
    to the Configuration class in the PHP SDK.

    ## 1.0.42
  `;

    it('should return the correct changes for a version that exists', () => {
        const result = extractVersionChanges(changelog, '1.0.44');
        expect(result).toBe('Added a set_timeout method to the Client class in the Python SDK');
    });

    it('should return the changes spread over multiple lines', () => {
        const result = extractVersionChanges(changelog, '1.0.43');
        expect(result).toBe('Added a setTimeout method\nto the Configuration class in the PHP SDK.');
    });

    it('should return the default message for a version without changes', () => {
        const result = extractVersionChanges(changelog, '1.0.42');
        expect(result).toBe('Nothing has been changed. Everything will work perfectly');
    });

    it('should return the default message for a version that does not exist', () => {
        const result = extractVersionChanges(changelog, '1.0.45');
        expect(result).toBe('Nothing has been changed. Everything will work perfectly');
    });
});
