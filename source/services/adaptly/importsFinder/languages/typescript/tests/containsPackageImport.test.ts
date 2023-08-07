import { TypeScriptImportChecker } from '../typescript';

describe('containsPackageImport:Typescript', () => {
    const checker = new TypeScriptImportChecker();

    it('detects import statement', async () => {
        const sourceCode = `import express from 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects require statement', async () => {
        const sourceCode = `const express = require('express');`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects dynamic import statement', async () => {
        const sourceCode = `
            import('express').then(module => {
                // Do something with module
            });
        `;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('returns false when package is not imported', async () => {
        const sourceCode = `import axios from 'axios';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('detects aliased import statement', async () => {
        const sourceCode = `import e from 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects aliased require statement', async () => {
        const sourceCode = `const e = require('express');`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('ignores commented out import statement', async () => {
        const sourceCode = `//import express from 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('ignores commented out require statement', async () => {
        const sourceCode = `//const express = require('express');`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('ignores import or require used as a string', async () => {
        const sourceCode = `const str = "import express from 'express';";`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('detects import from sub-directory of package', async () => {
        const sourceCode = `import something from 'express/something';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects import of a specific part of a module', async () => {
        const sourceCode = `import { Router } from 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects named imports', async () => {
        const sourceCode = `import * as express from 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects imports without any members (for side-effects)', async () => {
        const sourceCode = `import 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('handles multi-line import statements', async () => {
        const sourceCode = `
            import {
                Router,
                // some comment in the import
                json
            } from 'express';
        `;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('handles multi-line require statements', async () => {
        const sourceCode = `
            const {
                Router,
                // some comment in the require
                json
            } = require('express');
        `;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('handles case sensitivity', async () => {
        const sourceCode = `import express from 'Express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('handles package names that include "require" or "import"', async () => {
        const sourceCode = `import requireSomething from 'requireSomething';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'require')).toBe(false);
    });

    it('handles nested imports', async () => {
        const sourceCode = `
            function test() {
                import express from 'express';
            }
        `;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('handles multi-line dynamic import statements', async () => {
        const sourceCode = `
            import(
                'express'
            ).then(module => {
                // Do something with module
            });
        `;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('handles unusual formatting in import statement', async () => {
        const sourceCode = `import\texpress\nfrom\n'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('distinguishes between local and package imports', async () => {
        const sourceCode = `import express from './express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('detects import type statements', async () => {
        const sourceCode = `import type { Express } from 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('handles chained imports', async () => {
        const sourceCode = `import something from './anotherFile';`;
        // assuming 'express' is imported in 'anotherFile'
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(false);
    });

    it('handles spaces in import statement', async () => {
        const sourceCode = `import { Router }from 'express';`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects require statement with double quotes', async () => {
        const sourceCode = `const express = require("express");`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects dynamic import statement with double quotes', async () => {
        const sourceCode = `
            import("express").then(module => {
                // Do something with module
            });
        `;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects import statement with double quotes', async () => {
        const sourceCode = `import express from "express";`;
        const file = {
            path: 'oof.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'express')).toBe(true);
    });

    it('detects import statement with api key passed', async () => {
        const sourceCode = `const stripe = require("stripe")("sk_test_random_stripe_key");`;
        const file = {
            path: 'order.ts',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'stripe')).toBe(true);
    });
});
