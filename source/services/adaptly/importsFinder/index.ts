import fg from 'fast-glob';
import Logger from '@adaptly/logging/logger';
import { PythonImportChecker } from './languages/python/python';
import { TypeScriptImportChecker } from './languages/typescript/typescript';
import { ImportChecker } from './importChecker';
import { Ecosystems, getEcosystem } from './ecosystem/ecosystem';
import fs from 'fs/promises';
import { getCloneDestinationPath } from '@adaptly/services/git/clone';
import path from 'path';
import { getAbsolutePathInRepo } from './utils/getAbsolutePathInRepo';

export type File = {
    path: string;
    content: string;
};

export type IndirectFile = File & {
    importsFrom: File;
};

const checkersByEcosystem: { [key in Ecosystems]?: ImportChecker } = {
    [Ecosystems.Npm]: new TypeScriptImportChecker(),
    [Ecosystems.Pypi]: new PythonImportChecker()
};

export const findFiles = async (
    repoName: string,
    targetPackage: string,
    manifestFilename: string,
    dirName: string
): Promise<(File | IndirectFile)[]> => {
    const ecosystem = getEcosystem(manifestFilename);

    if (!ecosystem) {
        return [];
    }

    const checker = checkersByEcosystem[ecosystem];

    if (checker) {
        const directImportFiles = await findDirectImports(repoName, targetPackage, dirName, checker);
        const directImportFilesFormatted = removeHostPathFilesDirect(directImportFiles, repoName);

        Logger.info(`Found direct dependency imports`, {
            repoName,
            dirName,
            dependency: targetPackage,
            directImportFiles: directImportFilesFormatted
        });

        const indirectImportFiles = await findIndirectImports(repoName, directImportFiles, dirName, checker);
        const indirectImportFilesFormatted = removeHostPathFilesIndirect(indirectImportFiles, repoName);

        Logger.info(`Found indirect dependency imports`, {
            repoName,
            dirName,
            dependency: targetPackage,
            indirectImportFiles: indirectImportFilesFormatted
        });

        return [...directImportFilesFormatted, ...indirectImportFilesFormatted];
    } else {
        return [];
    }
};

async function findDirectImports(repoName: string, targetPackage: string, dirName: string, checker: ImportChecker): Promise<File[]> {
    const foundFiles: File[] = [];

    const clonedRepositoryPath = getCloneDestinationPath(repoName);

    const packagePath = dirName === '.' ? clonedRepositoryPath : path.resolve(clonedRepositoryPath, dirName);

    const filePaths = await fg(`${packagePath}/**/*`, { onlyFiles: true });

    for (const filePath of filePaths) {
        Logger.info(`Checking ${filePath}`);

        if (!checker.fileExtensionPattern.test(filePath)) {
            continue;
        }

        Logger.info(`Checking filePath ${filePath}`);

        const content = await fs.readFile(filePath, 'utf-8');

        const importFound = await checker.containsPackageImport({ path: filePath, content: content }, targetPackage);

        if (importFound) {
            Logger.info(`Found direct import in: ${filePath}`);
            foundFiles.push({ path: filePath, content });
        }
    }

    return foundFiles;
}

async function findIndirectImports(repoName: string, directImportFiles: File[], dirName: string, checker: ImportChecker): Promise<IndirectFile[]> {
    const foundFiles: IndirectFile[] = [];

    const clonedRepositoryPath = getCloneDestinationPath(repoName);

    const packagePath = dirName === '.' ? clonedRepositoryPath : path.resolve(clonedRepositoryPath, dirName);

    const filePaths = await fg(`${packagePath}/**/*`, { onlyFiles: true });

    for (const filePath of filePaths) {
        if (!checker.fileExtensionPattern.test(filePath)) {
            continue;
        }

        Logger.info(`Checking ${filePath} for indirect imports`);

        const content = await fs.readFile(filePath, 'utf-8');

        for (const importFile of directImportFiles) {
            if (filePath === importFile.path) {
                continue;
            }

            Logger.info(`Checking ${filePath} for indirect import\n ${importFile.path}\n`);

            const importFound = await checker.containsPathImport(packagePath, { path: filePath, content: content }, importFile.path);

            if (importFound) {
                Logger.info(`Found indirect import in: ${filePath}`);
                foundFiles.push({ path: filePath, content, importsFrom: importFile });
            }
        }
    }

    return foundFiles;
}

function removeHostPathFilesDirect(files: File[], repoName: string): File[] {
    return files.map((file) => {
        return {
            path: getAbsolutePathInRepo(file.path, repoName),
            content: file.content
        };
    });
}

function removeHostPathFilesIndirect(files: IndirectFile[], repoName: string): IndirectFile[] {
    return files.map((file) => {
        const [fileClean, importsFromClean] = removeHostPathFilesDirect([file, file.importsFrom], repoName);

        return {
            ...fileClean,
            importsFrom: importsFromClean
        };
    });
}
