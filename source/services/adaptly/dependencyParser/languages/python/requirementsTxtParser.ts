import { Dependencies, DependenciesParser } from '../../dependencyParser';
import { PyPiDependenciesParser } from './pypiDependenciesParser';

export class RequirementsTxtParser extends PyPiDependenciesParser implements DependenciesParser {
    parseDependencies(manifestContent: string): Dependencies {
        const dependencies: Dependencies = {};
        const lines = manifestContent.split('\n');

        lines.forEach((line) => {
            const [dependency, version] = line.split('==');
            if (dependency && version) {
                dependencies[dependency.trim()] = version.trim();
            }
        });

        return dependencies;
    }
}
