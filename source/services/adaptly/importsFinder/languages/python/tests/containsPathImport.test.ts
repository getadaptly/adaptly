import fs from 'fs';
import path from 'path';
import util from 'util';
import { getCloneDestinationPath } from '@adaptly/services/git/clone';
import { rimraf } from 'rimraf';
import { File } from '@adaptly/services/adaptly/importsFinder';
import { PythonImportChecker } from '../python';

const fsWriteFile = util.promisify(fs.writeFile);
const fsMkdir = util.promisify(fs.mkdir);

const REPO_NAME = 'owner-151204/repo-151204';
const packagePath = getCloneDestinationPath(REPO_NAME);

describe.skip('getAbsoluteImportPath', () => {
    beforeEach(async () => {
        await fsMkdir(packagePath, { recursive: true });
    });

    afterEach(async () => {
        // note(Lauris): we use path.dirname because REPO_NAME has x/y format
        await rimraf(path.dirname(packagePath));
    });

    it('should find "from . import something"', async () => {
        const fileImportPath = '.';
        const file = {
            path: path.join(packagePath, 'file.py'),
            content: `from ${fileImportPath} import client`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.resolve(packagePath, 'client.py');
        await createFile(
            dependencyPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find "from .somewhere import something"', async () => {
        const fileImportPath = '.client';
        const file = {
            path: path.join(packagePath, 'file.py'),
            content: `from ${fileImportPath} import client`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.join(packagePath, 'client.py');
        await createFile(
            dependencyPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('shouldn\'t find "from .somewhere import something"', async () => {
        const fileImportPath = '.user';
        const file = {
            path: path.join(packagePath, 'file.py'),
            content: `from ${fileImportPath} import user`
        };
        await createFile(file.path, file.content);

        const dependencySimplePath = path.join(packagePath, 'user.py');
        await createFile(dependencySimplePath, `user = mbappe`);

        const dependencyAffectedPath = path.join(packagePath, 'client.py');
        await createFile(
            dependencyAffectedPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencySimplePath, true);
        await runTest(packagePath, file, dependencyAffectedPath, false);
    });

    it('should find "from somewhere import something"', async () => {
        const fileImportPath = 'client';
        const file = {
            path: path.join(packagePath, 'file.py'),
            content: `from ${fileImportPath} import client`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.join(packagePath, 'client.py');
        await createFile(
            dependencyPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find "from ../../../../somewhere import something"', async () => {
        const fileImportPath = '../../../../client';
        const file = {
            path: path.join(packagePath, 'module1', 'module2', 'module3', '__init__.py'),
            content: `from ${fileImportPath} import client`
        };
        await fsMkdir(path.dirname(file.path), { recursive: true });
        await createFile(file.path, file.content);

        const dependencyPath = path.join(packagePath, 'client.py');
        await createFile(
            dependencyPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find "from somewhere.somewhere.somewhere + __init__ import something"', async () => {
        const fileImportPath = 'module1.module2.module3';
        const file = {
            path: path.join(packagePath, 'file.py'),
            content: `from ${fileImportPath} import client`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.join(packagePath, 'module1', 'module2', 'module3', '__init__.py');
        await fsMkdir(path.dirname(dependencyPath), { recursive: true });
        await createFile(
            dependencyPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find "from module1.module2.file import something"', async () => {
        const fileImportPath = 'module1.module2.client';
        const file = {
            path: path.join(packagePath, 'file.py'),
            content: `from ${fileImportPath} import client`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.join(packagePath, 'module1', 'module2', 'client.py');
        await fsMkdir(path.dirname(dependencyPath), { recursive: true });
        await createFile(
            dependencyPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });

    it('should find "__init__.py"', async () => {
        const fileImportPath = '__init__';
        const file = {
            path: path.join(packagePath, 'file.py'),
            content: `from ${fileImportPath} import client`
        };
        await createFile(file.path, file.content);

        const dependencyPath = path.join(packagePath, '__init__.py');
        await createFile(
            dependencyPath,
            `from prisma import PrismaClient
            client = PrismaClient()`
        );

        await runTest(packagePath, file, dependencyPath, true);
    });
});

async function createFile(filePath: string, content = '') {
    await fsWriteFile(filePath, content);
}

const checker = new PythonImportChecker();

async function runTest(packagePath: string, file: File, importPath: string, containsImportPath: boolean) {
    const result = await checker.containsPathImport(packagePath, file, importPath);

    expect(result).toEqual(containsImportPath);
}
