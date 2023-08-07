import * as toml from '@iarna/toml';
import { Dependencies, DependenciesParser } from '../../dependencyParser';
import { PyPiDependenciesParser } from './pypiDependenciesParser';

export class PyProjectTomlParser extends PyPiDependenciesParser implements DependenciesParser {
    parseDependencies(manifestContent: string): Dependencies {
        const parsedContent: any = toml.parse(manifestContent);

        if (!parsedContent['tool'] || !parsedContent['tool']['poetry'] || !parsedContent['tool']['poetry']['dependencies']) {
            return {};
        }

        const dependencies: Dependencies = parsedContent['tool']['poetry']['dependencies'];

        return dependencies;
    }
}
