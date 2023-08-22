import { ImportChecker } from '../../importChecker';
import { File } from '../..';
import { Project, CallExpression, Node, ts as tsMorph } from 'ts-morph';
import Logger from '@adaptly/logging/logger';
import { getAbsoluteImportPath } from './helpers/getAbsolutePath';
import ts from 'typescript';

export class TypeScriptImportChecker implements ImportChecker {
    private project: Project;

    constructor() {
        this.project = new Project();
    }

    get fileExtensionPattern(): RegExp {
        return /\.(ts|tsx|js|jsx)$/;
    }

    async containsPackageImport(file: File, targetPackage: string): Promise<boolean> {
        Logger.info(`Checking if ${file.path} is importing ${targetPackage}`);

        const sourceFile = this.project.createSourceFile(file.path, file.content, {
            overwrite: true
        });

        const packageImported = sourceFile.getImportDeclarations().some((importDeclaration) => {
            const moduleSpecifierValue = importDeclaration.getModuleSpecifierValue();
            // This will handle both full imports like 'express' and sub-directory imports like 'express/something'
            return moduleSpecifierValue === targetPackage || moduleSpecifierValue.startsWith(targetPackage + '/');
        });

        const declaredAsVariable = sourceFile.getVariableDeclarations().some((variableDeclaration) => {
            const initializer = variableDeclaration.getInitializer();
            if (!initializer || !Node.isCallExpression(initializer)) {
                return false;
            }

            // get the initial call expression
            let callExpression = initializer as CallExpression;
            let functionName = callExpression.getExpression().getText();

            // Check if there's a nested call expression
            if (Node.isCallExpression(callExpression.getExpression())) {
                callExpression = callExpression.getExpression() as CallExpression;
                functionName = callExpression.getExpression().getText();
            }

            // get the required module from the call expression and remove quotes
            const requiredModule = callExpression.getArguments()[0]?.getText().replace(/['"]/g, '');

            return functionName === 'require' && requiredModule === targetPackage;
        });

        const dynamicImported = sourceFile.getDescendantsOfKind(tsMorph.SyntaxKind.CallExpression).some((callExpression) => {
            if (!Node.isCallExpression(callExpression)) {
                return false;
            }
            const expression = callExpression.getExpression();
            return expression.getText() === 'import' && callExpression.getArguments()[0]?.getText().replace(/['"]/g, '') === targetPackage;
        });

        return packageImported || declaredAsVariable || dynamicImported;
    }

    async containsPathImport(packagePath: string, file: File, pathImportAbsolute: string): Promise<boolean> {
        Logger.info(`Checking if file is importing path`, { file: file.path, pathImport: pathImportAbsolute });

        const sourceFile = this.project.createSourceFile(file.path, file.content, {
            overwrite: true
        });

        let pathImported = false;
        const importDeclarations = sourceFile.getImportDeclarations();
        for (const importDeclaration of importDeclarations) {
            const moduleSpecifierValue = importDeclaration.getModuleSpecifierValue();

            const moduleSpecifierAbsolute = await getAbsoluteImportPath(packagePath, file.path, moduleSpecifierValue);

            pathImported = moduleSpecifierAbsolute === pathImportAbsolute;

            if (pathImported) {
                Logger.info(`Found path import simple`, { file: file.path, pathImport: pathImportAbsolute });
                break;
            }
        }

        let declaredAsVariable = false;
        const variableDeclarations = sourceFile.getVariableDeclarations();
        for (const variableDeclaration of variableDeclarations) {
            const initializer = variableDeclaration.getInitializer();
            if (!initializer || !Node.isCallExpression(initializer)) {
                continue;
            }

            // get the initial call expression
            let callExpression = initializer as CallExpression;
            let functionName = callExpression.getExpression().getText();

            // Check if there's a nested call expression
            if (Node.isCallExpression(callExpression.getExpression())) {
                callExpression = callExpression.getExpression() as CallExpression;
                functionName = callExpression.getExpression().getText();
            }

            // get the required module from the call expression and remove quotes
            const requiredModule = callExpression.getArguments()[0]?.getText().replace(/['"]/g, '');

            const requiredModuleAbsolute = await getAbsoluteImportPath(packagePath, file.path, requiredModule);

            declaredAsVariable = functionName === 'require' && requiredModuleAbsolute === pathImportAbsolute;

            if (declaredAsVariable) {
                Logger.info(`Found path import variable`, { file: file.path, pathImport: pathImportAbsolute });
                break;
            }
        }

        let dynamicImported = false;
        const callExpressions = sourceFile.getDescendantsOfKind(tsMorph.SyntaxKind.CallExpression);

        for (const callExpression of callExpressions) {
            if (!Node.isCallExpression(callExpression)) {
                continue;
            }
            const expression = callExpression.getExpression();

            if ((expression.getKind() as number) !== ts.SyntaxKind.ImportKeyword) {
                continue; // Skip non-import function expressions
            }

            const importValue = callExpression.getArguments()[0]?.getText().replace(/['"]/g, '');
            const dynamicAbsolute = await getAbsoluteImportPath(packagePath, file.path, importValue);

            dynamicImported = expression.getText() === 'import' && dynamicAbsolute === pathImportAbsolute;

            if (dynamicImported) {
                Logger.info(`Found path import dynamic`, { file: file.path, pathImport: pathImportAbsolute });
                break;
            }
        }

        return pathImported || declaredAsVariable || dynamicImported;
    }
}
