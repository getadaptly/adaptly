import path from 'path';
import { RequirementsTxtParser } from './languages/python/requirementsTxtParser';
import { PyProjectTomlParser } from './languages/python/pyProjectTomlParser';
import { PackageJsonParser } from './languages/typescript/packageJsonParser';
import { DependenciesParser } from './dependencyParser';

type ParserData = {
    regex: RegExp;
    parser: DependenciesParser;
};

export class ParserFactory {
    private static parsers: ParserData[] = [
        {
            regex: /package\.json$/,
            parser: new PackageJsonParser()
        },
        {
            regex: /\w*-?requirements(-\w+)?\.txt$/,
            parser: new RequirementsTxtParser()
        },
        {
            regex: /\w*-?pyproject(-\w+)?\.toml$/,
            parser: new PyProjectTomlParser()
        }
    ];

    static getParser(filePath: string): DependenciesParser {
        const fileName = path.basename(filePath);
        let parser;

        for (const parserData of this.parsers) {
            if (parserData.regex.test(fileName)) {
                parser = parserData.parser;
                break;
            }
        }

        if (!parser) {
            throw new Error(`Unsupported manifest file: ${fileName}`);
        }

        return parser;
    }

    static getSupportedManifests(): RegExp[] {
        return this.parsers.map((parserData) => parserData.regex);
    }
}
