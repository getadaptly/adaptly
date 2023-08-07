import ts from 'typescript';
import * as path from 'path';
import fg from 'fast-glob';
import { ErrorHandler, TypescriptError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import Logger, { getMessage } from '@adaptly/logging/logger';

export async function getAbsoluteImportPath(packagePath: string, filePath: string, importPath: string): Promise<string> {
    try {
        const project = await createProject(packagePath);

        const sourceFile = project.getSourceFile(filePath);
        if (!sourceFile) {
            throw new Error(`File '${filePath}' not found in program.`);
        }

        const compilerOptions = project.getCompilerOptions();
        const path = resolvePath(sourceFile, importPath, compilerOptions);

        Logger.info(`Resolved Typescript file import path`, { rootDir: packagePath, file: filePath, importPath, importPathResolved: path });

        return path;
    } catch (error) {
        throwPathResolver(error);
    }
}

async function createProject(rootDir: string): Promise<ts.Program> {
    const rootFiles = await fg(path.join(rootDir, '**/*.ts'));
    const compilerOptions = getCompilerOptions(rootDir);

    const program = ts.createProgram(rootFiles, compilerOptions);

    return program;
}

function getCompilerOptions(rootDir: string): ts.CompilerOptions {
    const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, 'tsconfig.json');

    if (!configPath) {
        throw new Error(`Could not find a valid 'tsconfig.json'.`);
    }

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));

    return config.options;
}

function resolvePath(sourceFile: ts.SourceFile, importPath: string, compilerOptions: ts.CompilerOptions): string {
    const compilerHost = ts.createCompilerHost(compilerOptions);

    const { resolvedModule } = ts.nodeModuleNameResolver(importPath, sourceFile.fileName, compilerOptions, compilerHost);

    return resolvedModule?.resolvedFileName || '';
}

const throwPathResolver: ErrorHandler = (error: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.couldNotResolvePathImport), error);

    throw new TypescriptError(ADAPTLY_ERRORS.couldNotResolvePathImport, error);
};
