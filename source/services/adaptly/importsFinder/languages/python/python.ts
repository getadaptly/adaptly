import { ImportChecker } from '../../importChecker';
import { File } from '../..';
import Logger from '@adaptly/logging/logger';
import Parser from 'tree-sitter';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as child_process from 'child_process';

// Convert callback-based functions to Promises
const readdir = util.promisify(fs.readdir);
const exec = util.promisify(child_process.exec);

const treeSitterPython = require('tree-sitter-python');

interface PyDepsOutput {
    bacon?: number;
    imports?: string[];
    name?: string;
    path?: string;
    imported_by?: string[];
}

export class PythonImportChecker implements ImportChecker {
    private parser: Parser;
    private pyDepsData: Map<string, PyDepsOutput> = new Map();

    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(treeSitterPython);
    }

    get fileExtensionPattern(): RegExp {
        return /\.py$/;
    }

    async containsPackageImport(file: File, targetPackage: string): Promise<boolean> {
        Logger.info(`Checking if ${file.path} is importing ${targetPackage}`);

        const tree = this.parser.parse(file.content);

        const importNodes = this.findAllImportNodes(tree.rootNode);

        for (const node of importNodes) {
            if (this.nodeContainsPackage(node, targetPackage)) {
                return true;
            }
        }

        return false;
    }

    private findAllImportNodes(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
        let nodes: Parser.SyntaxNode[] = [];

        if (node.type === 'import_from_statement' || node.type === 'import_statement') {
            nodes.push(node);
        }

        for (const child of node.namedChildren) {
            nodes = nodes.concat(this.findAllImportNodes(child));
        }

        return nodes;
    }

    private nodeContainsPackage(node: Parser.SyntaxNode, targetPackage: string): boolean {
        let found = false;

        // Convert targetPackage to correct import format
        const targetModule = targetPackage.replace('-', '_').toLowerCase();

        if (node.type === 'import_statement') {
            for (const child of node.namedChildren) {
                if (child.type === 'dotted_name' || child.type === 'aliased_import') {
                    if (child.text.startsWith(targetModule) || child.text === targetModule) {
                        found = true;
                        break;
                    }
                }
            }
        } else if (node.type === 'import_from_statement') {
            for (const child of node.namedChildren) {
                if (child.type === 'dotted_name') {
                    if (child.text.startsWith(targetModule) || child.text === targetModule) {
                        found = true;
                        break;
                    }
                }
            }
        }
        return found;
    }

    async containsPathImport(packagePath: string, file: File, pathImportAbsolute: string): Promise<boolean> {
        if (this.pyDepsData.size === 0) {
            await this.loadPackage(packagePath);
        }

        let foundImport = false;
        this.pyDepsData.forEach((fileData) => {
            if (fileData.path === pathImportAbsolute) {
                if (fileData.imported_by) {
                    for (const importName of fileData.imported_by) {
                        const importFileData = this.pyDepsData.get(importName);

                        if (importFileData && importFileData.path === file.path) {
                            foundImport = true;
                            return;
                        }
                    }
                }
            }
        });

        return foundImport;
    }

    async loadPackage(packagePath: string): Promise<void> {
        const entries = await readdir(packagePath, { withFileTypes: true });

        // Filter files for .py and directories
        const pathsToCheck = entries
            .filter((entry) => (entry.isFile() && entry.name.endsWith('.py')) || entry.isDirectory())
            .map((entry) => path.join(packagePath, entry.name));

        // Start tasks for each path
        const tasks = pathsToCheck.map(async (fullPath) => {
            const pyDepsCommand = `pydeps --show-deps --no-output ${fullPath}`;
            const { stderr, stdout } = await exec(pyDepsCommand);
            if (!stderr) {
                const jsonOutput: { [key: string]: PyDepsOutput } = JSON.parse(stdout);
                for (const key in jsonOutput) {
                    const existing = this.pyDepsData.get(key);
                    const newData = jsonOutput[key];

                    if (existing) {
                        // Merge new data into existing data
                        this.pyDepsData.set(key, {
                            ...existing,
                            ...newData,
                            imports: [...(existing.imports || []), ...(newData.imports || [])],
                            imported_by: [...(existing.imported_by || []), ...(newData.imported_by || [])]
                        });
                    } else {
                        // Store new data
                        this.pyDepsData.set(key, newData);
                    }
                }
            }
        });

        // Wait for all tasks to complete
        await Promise.all(tasks);
    }
}
