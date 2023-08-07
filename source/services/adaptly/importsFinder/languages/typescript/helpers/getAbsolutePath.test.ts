import fs from 'fs';
import path from 'path';
import util from 'util';
import { getAbsoluteImportPath } from './getAbsolutePath';
import { getCloneDestinationPath } from '@adaptly/services/git/clone';
import { rimraf } from 'rimraf';

const fsWriteFile = util.promisify(fs.writeFile);
const fsMkdir = util.promisify(fs.mkdir);

const REPO_NAME = 'owner-360560/repo-360560';
const packagePath = getCloneDestinationPath(REPO_NAME);

describe('getAbsoluteImportPath:Typescript', () => {
    beforeEach(async () => {
        await fsMkdir(packagePath, { recursive: true });

        await fsWriteFile(
            path.join(packagePath, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    target: 'es5',
                    module: 'commonjs',
                    strict: true
                }
            })
        );
    });

    afterEach(async () => {
        // note(Lauris): we use path.dirname because REPO_NAME has x/y format
        await rimraf(path.dirname(packagePath));
    });

    it('should resolve import from the same folder', async () => {
        const filePath = path.resolve(packagePath, 'file.ts');
        const fileImportPath = './client';
        await createFile(filePath, `import { client } from "${fileImportPath}";`);

        const dependencyPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(filePath, fileImportPath, dependencyPath);
    });

    it('should throw error if import from non existing file', async () => {
        const filePath = path.resolve(packagePath, 'file.ts');
        // note(Lauris): we import from parent folder but client is defined in same folder
        const fileImportPath = '../client';
        await createFile(filePath, `import { client } from "${fileImportPath}";`);

        const dependencyPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        let errorOccurred = false;
        try {
            await runTest(filePath, fileImportPath, dependencyPath);
        } catch (error) {
            errorOccurred = true;
        }
        expect(errorOccurred).toEqual(true);
    });

    it('should resolve import from the parent folder', async () => {
        await fsMkdir(`${packagePath}/folder`, { recursive: true });

        const filePath = path.resolve(packagePath, 'folder/file.ts');
        const fileImportPath = '../client';
        await createFile(filePath, `import { client } from "${fileImportPath}";`);

        const dependencyPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(filePath, fileImportPath, dependencyPath);
    });

    it('should resolve import with custom baseUrl', async () => {
        const src = `${packagePath}/src`;
        await fsMkdir(src, { recursive: true });

        await fsWriteFile(
            path.join(packagePath, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    target: 'es5',
                    module: 'commonjs',
                    strict: true,
                    baseUrl: src
                }
            })
        );

        const filePath = path.resolve(src, 'file.ts');
        const fileImportPath = 'prisma/client';
        await createFile(filePath, `import { client } from "${fileImportPath}";`);

        const dependencyFolder = `${src}/prisma`;
        await fsMkdir(dependencyFolder, { recursive: true });

        const dependencyPath = path.resolve(dependencyFolder, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(filePath, fileImportPath, dependencyPath);
    });

    it('should resolve import with custom paths', async () => {
        const src = `${packagePath}/src`;
        await fsMkdir(src, { recursive: true });

        await fsWriteFile(
            path.join(packagePath, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    target: 'es5',
                    module: 'commonjs',
                    strict: true,
                    paths: {
                        '@adaptly/*': ['./src/*']
                    }
                }
            })
        );

        const filePath = path.resolve(src, 'file.ts');
        const fileImportPath = '@adaptly/prisma/client';
        await createFile(filePath, `import { client } from "${fileImportPath}";`);

        const dependencyFolder = `${src}/prisma`;
        await fsMkdir(dependencyFolder, { recursive: true });

        const dependencyPath = path.resolve(dependencyFolder, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(filePath, fileImportPath, dependencyPath);
    });
});

async function createFile(filePath: string, content = '') {
    await fsWriteFile(filePath, content);
}

async function runTest(filePath: string, importPath: string, expectedResolvedPath: string) {
    const result = await getAbsoluteImportPath(packagePath, filePath, importPath);

    expect(result).toEqual(expectedResolvedPath);
}
