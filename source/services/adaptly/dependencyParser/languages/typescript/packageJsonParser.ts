import { NPM_API_URL } from '@adaptly/consts';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, NpmError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { parseJSON } from '@adaptly/utils/json/parseJson';
import axios, { AxiosResponse } from 'axios';
import semver from 'semver';
import { Dependencies, DependenciesParser } from '../../dependencyParser';

const NAMESPACE = 'PACKAGE_JSON_PARSER';

type Manifest = {
    dependencies: Dependencies;
    devDependencies?: Dependencies;
};

export class PackageJsonParser implements DependenciesParser {
    parseDependencies(manifestContent: string): Dependencies {
        const manifest: Manifest = parseJSON(manifestContent);
        const dependencies = this.coerceVersions(manifest.dependencies);
        const devDependencies = manifest.devDependencies ? this.coerceVersions(manifest.devDependencies) : {};

        return { ...dependencies, ...devDependencies };
    }

    coerceVersions(dependencies: Dependencies): Dependencies {
        const coercedDependencies: Dependencies = {};

        for (const dependency in dependencies) {
            const coercedVersion = semver.coerce(dependencies[dependency]);

            if (coercedVersion) {
                coercedDependencies[dependency] = coercedVersion.version;
            }
        }

        return coercedDependencies;
    }

    async getDependencyRepoUrl(packageName: string): Promise<string> {
        Logger.info(NAMESPACE, `Looking for the GH repo of ${packageName}`);
        const npmApiUrl = `${NPM_API_URL}/${packageName}`;

        try {
            const response: AxiosResponse = await axios.get(npmApiUrl);

            const packageInfo = response.data;
            const repository = packageInfo.repository;

            let repoUrl = '';

            if (repository) {
                repoUrl = packageInfo.repository.url;
            } else {
                const maintainer = packageInfo.maintainers[0].name;
                const repoName = `${maintainer}/${packageName}`;
                repoUrl = `git+https://github.com/${repoName}.git`;
            }

            if (!repoUrl) {
                throw new Error('No repoUrl');
            }

            Logger.info(NAMESPACE, `Found GH repo: ${repoUrl}`);
            return repoUrl;
        } catch (error) {
            this.throwGithubUrlError(error, { packageName });
        }
    }

    throwGithubUrlError: ErrorHandler = (error: any, context: any) => {
        Logger.error(getMessage(ADAPTLY_ERRORS.retrievingGitHubUrl), error, context);

        throw new NpmError(ADAPTLY_ERRORS.retrievingGitHubUrl, context);
    };

    getDependencyUrl(packageName: string): string {
        return `https://www.npmjs.com/package/${packageName}`;
    }
}
