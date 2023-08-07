import { RequirementsTxtParser } from './requirementsTxtParser';
import axios from 'axios';
import { PYPI_API_URL } from '@adaptly/consts';

jest.mock('axios');
jest.mock('@adaptly/logging/axiom', () => {
    return {
        axiom: {
            ingestEvents: jest.fn()
        }
    };
});

describe('RequirementsTxtParser', () => {
    let parser: RequirementsTxtParser;

    beforeEach(() => {
        parser = new RequirementsTxtParser();
        (axios.get as jest.Mock).mockClear();
    });

    it('should return the correct github url', async () => {
        // Setup
        const packageName = 'package';
        const mockedResponse = {
            data: {
                info: {
                    project_urls: {
                        'Source Code': 'https://github.com/owner/package'
                    }
                }
            }
        };
        (axios.get as jest.Mock).mockResolvedValueOnce(mockedResponse);

        // Execute
        const url = await parser.getDependencyRepoUrl(packageName);

        // Assert
        expect(axios.get).toHaveBeenCalledWith(`${PYPI_API_URL}/${packageName}/json`);
        expect(url).toEqual('https://github.com/owner/package');
    });

    it('should throw error when no github url is found', async () => {
        // Setup
        const packageName = 'package';
        const mockedResponse = {
            data: {
                info: {
                    project_urls: {
                        Documentation: 'https://readthedocs.org/package'
                    }
                }
            }
        };
        (axios.get as jest.Mock).mockResolvedValueOnce(mockedResponse);

        // Assert
        await expect(parser.getDependencyRepoUrl(packageName)).rejects.toThrow(`Unable to retrieve the GitHub URL for ${packageName}`);
    });

    it('should return GitHub URL when GitHub URL is under "Download" key in project_urls', async () => {
        const packageName = 'tensorflow';
        const expectedGithubUrl = 'https://github.com/tensorflow/tensorflow';

        (axios.get as jest.Mock).mockResolvedValueOnce({
            data: {
                info: {
                    project_urls: {
                        Download: 'https://github.com/tensorflow/tensorflow/tags',
                        Homepage: 'https://www.tensorflow.org/'
                    }
                }
            }
        });

        const githubUrl = await parser.getDependencyRepoUrl(packageName);

        expect(axios.get).toHaveBeenCalledWith(`${PYPI_API_URL}/${packageName}/json`);
        expect(githubUrl).toEqual(expectedGithubUrl);
    });
});
