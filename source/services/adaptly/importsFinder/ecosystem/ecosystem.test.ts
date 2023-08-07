import { Ecosystems, getEcosystem } from './ecosystem';

describe('getEcosystem', () => {
    test('returns correct ecosystem for package.json', () => {
        const filePath = 'path/to/package.json';
        const ecosystem = getEcosystem(filePath);

        expect(ecosystem).toBe(Ecosystems.Npm);
    });

    test('returns correct ecosystem for poetry.lock', () => {
        const filePath = 'path/to/poetry.lock';
        const ecosystem = getEcosystem(filePath);

        expect(ecosystem).toBe(Ecosystems.Pypi);
    });

    test('returns correct ecosystem for requirements.txt', () => {
        const filePath = 'path/to/requirements.txt';
        const ecosystem = getEcosystem(filePath);

        expect(ecosystem).toBe(Ecosystems.Pypi);
    });

    test('returns correct ecosystem for prod-requirements.txt', () => {
        const filePath = 'path/to/prod-requirements.txt';
        const ecosystem = getEcosystem(filePath);

        expect(ecosystem).toBe(Ecosystems.Pypi);
    });

    test('returns correct ecosystem for requirements-dev.txt', () => {
        const filePath = 'path/to/requirements-dev.txt';
        const ecosystem = getEcosystem(filePath);

        expect(ecosystem).toBe(Ecosystems.Pypi);
    });

    test('returns null for unsupported file', () => {
        const filePath = 'path/to/unsupported.xml';
        const ecosystem = getEcosystem(filePath);

        expect(ecosystem).toBeNull();
    });
});
