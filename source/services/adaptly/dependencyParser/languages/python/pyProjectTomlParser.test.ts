import { PyProjectTomlParser } from './pyProjectTomlParser';

describe('PyProjectTomlParser', () => {
    let parser: PyProjectTomlParser;

    beforeEach(() => {
        parser = new PyProjectTomlParser();
    });

    it('should return dependencies when provided', () => {
        const content = `
        [tool.poetry]
        name = "my-package"

        [tool.poetry.dependencies]
        python = "^3.7"
        sqlparse = "0.4.4"
        `;

        const expected = {
            python: '^3.7',
            sqlparse: '0.4.4'
        };

        const result = parser.parseDependencies(content);
        expect(result).toEqual(expected);
    });

    it('should return empty object when no dependencies', () => {
        const content = `
        [tool.poetry]
        name = "my-package"
        `;

        const result = parser.parseDependencies(content);
        expect(result).toEqual({});
    });

    it('should return empty object when file is empty', () => {
        const content = '';
        const result = parser.parseDependencies(content);
        expect(result).toEqual({});
    });
});
