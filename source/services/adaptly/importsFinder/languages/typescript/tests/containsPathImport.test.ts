import fs from 'fs';
import path from 'path';
import util from 'util';
import { getCloneDestinationPath } from '@adaptly/services/git/clone';
import { rimraf } from 'rimraf';
import { File } from '@adaptly/services/adaptly/importsFinder';
import { TypeScriptImportChecker } from '../typescript';

const fsWriteFile = util.promisify(fs.writeFile);
const fsMkdir = util.promisify(fs.mkdir);

const REPO_NAME = 'owner-269860/repo-269860';
const packagePath = getCloneDestinationPath(REPO_NAME);

describe('containsPathImport:Typescript', () => {
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

    it('should find import in the same folder', async () => {
        const fileImportPath = './client';
        const file = {
            path: path.resolve(packagePath, 'file.ts'),
            content: `import { client } from "${fileImportPath}";`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it("shouldn't find import in the same folder", async () => {
        const file = {
            path: path.resolve(packagePath, 'file.ts'),
            content: `import { user } from "./user";`
        };
        await createFile(file.path, file.content);

        const dependencySimplePath = path.resolve(packagePath, 'user.ts');
        await createFile(
            dependencySimplePath,
            `const user = { name: "Cristiano Ronaldo" };
            export { user };`
        );

        const directAffectedPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            directAffectedPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(packagePath, file, dependencySimplePath, true);
        await runTest(packagePath, file, directAffectedPath, false);
    });

    it('should find require in the same folder', async () => {
        const fileImportPath = './client';
        const file = {
            path: path.resolve(packagePath, 'file.ts'),
            content: `const { client } = require("${fileImportPath}");`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find dynamic import in the same folder', async () => {
        const fileImportPath = './client';
        const file = {
            path: path.resolve(packagePath, 'file.ts'),
            content: `import('${fileImportPath}').then(module => {
                // Do something with module
            });`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find import in the parent folder', async () => {
        const fileImportPath = '../client';
        const file = {
            path: path.resolve(packagePath, 'folder/file.ts'),
            content: `import { client } from "${fileImportPath}";`
        };
        await fsMkdir(`${packagePath}/folder`, { recursive: true });
        await createFile(file.path, file.content);

        const dependencyPath = path.resolve(packagePath, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should fine import with custom baseUrl', async () => {
        // baseUrl root
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

        const fileImportPath = 'prisma/client';
        const file = {
            path: path.resolve(src, 'file.ts'),
            content: `import { client } from "${fileImportPath}";`
        };
        await createFile(file.path, file.content);

        const dependencyFolder = `${src}/prisma`;
        await fsMkdir(dependencyFolder, { recursive: true });
        const dependencyPath = path.resolve(dependencyFolder, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find import with custom paths', async () => {
        // root that custom path resolves to
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

        const fileImportPath = '@adaptly/prisma/client';
        const file = {
            path: path.resolve(src, 'file.ts'),
            content: `import { client } from "${fileImportPath}";`
        };
        await createFile(file.path, file.content);

        const dependencyFolder = `${src}/prisma`;
        await fsMkdir(dependencyFolder, { recursive: true });
        const dependencyPath = path.resolve(dependencyFolder, 'client.ts');
        await createFile(
            dependencyPath,
            `import { PrismaClient } from '@prisma/client';
            const client = new PrismaClient();
            export { client };`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });
});

async function createFile(filePath: string, content = '') {
    await fsWriteFile(filePath, content);
}

const checker = new TypeScriptImportChecker();

async function runTest(packagePath: string, file: File, importPath: string, containsImportPath: boolean) {
    const result = await checker.containsPathImport(packagePath, file, importPath);

    expect(result).toEqual(containsImportPath);
}
