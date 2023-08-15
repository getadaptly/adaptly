import fs from 'fs/promises';
import path from 'path';
import { getCloneDestinationPath } from '@adaptly/services/git/clone';
import { findFiles } from './index';
import { rimraf } from 'rimraf';
import { getAbsolutePathInRepo } from './utils/getAbsolutePathInRepo';

const REPO_NAME = 'owner-541408/repo-541408';
const packagePath = getCloneDestinationPath(REPO_NAME);

const createFile = async (filePath: string, content = '') => {
    await fs.writeFile(filePath, content);
};

describe.skip('findFiles', () => {
    beforeEach(async () => {
        await fs.mkdir(packagePath, { recursive: true });
    });

    afterEach(async () => {
        // note(Lauris): we use path.dirname because REPO_NAME has x/y format
        await rimraf(path.dirname(packagePath));
    });

    it('should find imports for TypeScript ecosystem', async () => {
        const manifestFilename = 'package.json';
        const targetPackage = '@prisma/client';

        const directAffectedDependencyFile = {
            path: path.resolve(packagePath, 'client.ts'),
            content: `import { PrismaClient } from '${targetPackage}';
            const client = new PrismaClient();
            export { client };`
        };

        const indirectAffectedDependencyFile = {
            path: path.resolve(packagePath, 'login.ts'),
            content: `
            import { client } from "./client";`
        };

        const notAffectedFile = {
            path: path.resolve(packagePath, 'statistics.ts'),
            content: `
            const usersCount = 100;`
        };

        await createFile(directAffectedDependencyFile.path, directAffectedDependencyFile.content);
        await createFile(indirectAffectedDependencyFile.path, indirectAffectedDependencyFile.content);
        await createFile(notAffectedFile.path, notAffectedFile.content);

        const foundFiles = await findFiles(REPO_NAME, targetPackage, manifestFilename, packagePath);

        expect(foundFiles).toHaveLength(2);

        expect(foundFiles[0]).toEqual({
            path: getAbsolutePathInRepo(directAffectedDependencyFile.path, REPO_NAME),
            content: directAffectedDependencyFile.content
        });

        expect(foundFiles[1]).toEqual({
            path: getAbsolutePathInRepo(indirectAffectedDependencyFile.path, REPO_NAME),
            content: indirectAffectedDependencyFile.content,
            importsFrom: {
                path: getAbsolutePathInRepo(directAffectedDependencyFile.path, REPO_NAME),
                content: directAffectedDependencyFile.content
            }
        });
    });

    it('should find imports for Python ecosystem', async () => {
        const manifestFilename = 'requirements.txt';
        const targetPackage = 'pandas';

        const directAffectedDependencyFile = {
            path: path.resolve(packagePath, 'data_processing.py'),
            content: `import ${targetPackage} as pd
        df = pd.DataFrame()`
        };

        const indirectAffectedDependencyFile = {
            path: path.resolve(packagePath, 'main.py'),
            content: `
        from data_processing import df`
        };

        const notAffectedFile = {
            path: path.resolve(packagePath, 'statistics.py'),
            content: `
        usersCount = 100`
        };

        await createFile(directAffectedDependencyFile.path, directAffectedDependencyFile.content);
        await createFile(indirectAffectedDependencyFile.path, indirectAffectedDependencyFile.content);
        await createFile(notAffectedFile.path, notAffectedFile.content);

        const foundFiles = await findFiles(REPO_NAME, targetPackage, manifestFilename, packagePath);

        expect(foundFiles).toHaveLength(2);

        expect(foundFiles[0]).toEqual({
            path: getAbsolutePathInRepo(directAffectedDependencyFile.path, REPO_NAME),
            content: directAffectedDependencyFile.content
        });

        expect(foundFiles[1]).toEqual({
            path: getAbsolutePathInRepo(indirectAffectedDependencyFile.path, REPO_NAME),
            content: indirectAffectedDependencyFile.content,
            importsFrom: {
                path: getAbsolutePathInRepo(directAffectedDependencyFile.path, REPO_NAME),
                content: directAffectedDependencyFile.content
            }
        });
    });
});
