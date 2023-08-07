import { PYPI_API_URL } from '@adaptly/consts';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, PyPiError } from '@adaptly/errors/types';
import Logger, { getMessage } from '@adaptly/logging/logger';
import axios from 'axios';
import { Dependencies, DependenciesParser } from '../../dependencyParser';

const NAMESPACE = 'PYPI_DEPENDENCIES_PARSER';

export abstract class PyPiDependenciesParser implements DependenciesParser {
    abstract parseDependencies(manifestContent: string): Dependencies;

    async getDependencyRepoUrl(packageName: string): Promise<string> {
        Logger.info(NAMESPACE, `Looking for the GH repo of ${packageName}`);
        const pypiApiUrl = `${PYPI_API_URL}/${packageName}/json`;
        try {
            const response = await axios.get(pypiApiUrl);

            const projectUrls = response.data.info && response.data.info.project_urls;
            let githubUrl;

            if (projectUrls) {
                // Iterate over project_urls looking for a GitHub URL.
                for (let urlKey in projectUrls) {
                    let url = projectUrls[urlKey];
                    // Match the 'https://github.com/<owner>/<package>' format.
                    if (url.includes(`github.com`) && url.split('/').length >= 5) {
                        let urlParts = url.split('/');
                        githubUrl = 'https://' + urlParts[2] + '/' + urlParts[3] + '/' + urlParts[4];
                        break;
                    }
                }
            }

            if (!githubUrl) {
                throw new Error(`Github repo URL not found for package ${packageName}`);
            }

            return githubUrl;
        } catch (error) {
            this.throwGithubUrlError(error, { packageName });
        }
    }

    throwGithubUrlError: ErrorHandler = (error: any, context: any) => {
        Logger.error(getMessage(ADAPTLY_ERRORS.retrievingGitHubUrl), error, context);

        throw new PyPiError(ADAPTLY_ERRORS.retrievingGitHubUrl, context);
    };

    getDependencyUrl(packageName: string): string {
        return `https://pypi.org/project/${packageName}`;
    }
}
