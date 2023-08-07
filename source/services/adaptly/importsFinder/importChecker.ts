import { File } from './index';

export interface ImportChecker {
    containsPackageImport(file: File, targetPackage: string): Promise<boolean>;
    containsPathImport(packagePath: string, file: File, pathImport: string): Promise<boolean>;
    readonly fileExtensionPattern: RegExp;
}
