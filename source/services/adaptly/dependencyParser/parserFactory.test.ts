import path from 'path';
import { ParserFactory } from './index';
import { PackageJsonParser } from './languages/typescript/packageJsonParser';
import { RequirementsTxtParser } from './languages/python/requirementsTxtParser';
import { PyProjectTomlParser } from './languages/python/pyProjectTomlParser';

describe('ParserFactory', () => {
    test('getParser returns correct parser for package.json', () => {
        const filePath = path.join('some', 'path', 'to', 'package.json');
        const parser = ParserFactory.getParser(filePath);

        expect(parser).toBeInstanceOf(PackageJsonParser);
    });

    test('getParser returns correct parser for requirements.txt', () => {
        const filePath = path.join('some', 'path', 'to', 'requirements.txt');
        const parser = ParserFactory.getParser(filePath);

        expect(parser).toBeInstanceOf(RequirementsTxtParser);
    });

    test('getParser returns correct parser for prod-requirements.txt', () => {
        const filePath = path.join('some', 'path', 'to', 'prod-requirements.txt');
        const parser = ParserFactory.getParser(filePath);

        expect(parser).toBeInstanceOf(RequirementsTxtParser);
    });

    test('getParser returns correct parser for requirements-dev.txt', () => {
        const filePath = path.join('some', 'path', 'to', 'requirements-dev.txt');
        const parser = ParserFactory.getParser(filePath);

        expect(parser).toBeInstanceOf(RequirementsTxtParser);
    });

    test('getParser throws error for unsupported file', () => {
        const filePath = path.join('some', 'path', 'to', 'unsupported.xml');

        expect(() => ParserFactory.getParser(filePath)).toThrowError(`Unsupported manifest file: unsupported.xml`);
    });

    test('getParser returns correct parser for pyproject.toml', () => {
        const filePath = path.join('some', 'path', 'to', 'pyproject.toml');
        const parser = ParserFactory.getParser(filePath);

        expect(parser).toBeInstanceOf(PyProjectTomlParser);
    });

    test('getParser returns correct parser for prod-pyproject.toml', () => {
        const filePath = path.join('some', 'path', 'to', 'prod-pyproject.toml');
        const parser = ParserFactory.getParser(filePath);

        expect(parser).toBeInstanceOf(PyProjectTomlParser);
    });

    test('getParser returns correct parser for pyproject-dev.toml', () => {
        const filePath = path.join('some', 'path', 'to', 'pyproject-dev.toml');
        const parser = ParserFactory.getParser(filePath);

        expect(parser).toBeInstanceOf(PyProjectTomlParser);
    });

    test('getSupportedManifests returns correct regex patterns', () => {
        const manifestPatterns = ParserFactory.getSupportedManifests();

        expect(manifestPatterns).toEqual([/package\.json$/, /\w*-?requirements(-\w+)?\.txt$/, /\w*-?pyproject(-\w+)?\.toml$/]);
    });
});
