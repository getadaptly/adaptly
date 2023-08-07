import { getRepoOwnerAndName } from './changelogHunter';

describe('getRepoOwnerAndName', () => {
    test('should return correct repo owner and name for standard github url', () => {
        const { repoOwner, repoName } = getRepoOwnerAndName('https://github.com/numpy/numpy');
        expect(repoOwner).toBe('numpy');
        expect(repoName).toBe('numpy');
    });

    test('should return correct repo owner and name for github url with .git', () => {
        const { repoOwner, repoName } = getRepoOwnerAndName('git+https://github.com/prisma/prisma.git');
        expect(repoOwner).toBe('prisma');
        expect(repoName).toBe('prisma');
    });

    test('should return correct repo owner and name for github url with additional path', () => {
        const { repoOwner, repoName } = getRepoOwnerAndName('https://github.com/tensorflow/tensorflow/tags');
        expect(repoOwner).toBe('tensorflow');
        expect(repoName).toBe('tensorflow');
    });
});
