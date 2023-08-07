import { PythonImportChecker } from '../python';

describe('containsPackageImport:Python', () => {
    const checker = new PythonImportChecker();

    it('detects import statement', async () => {
        const sourceCode = `import os`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'os')).toBe(true);
    });

    it('detects from-import statement', async () => {
        const sourceCode = `from collections import defaultdict`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'collections')).toBe(true);
    });

    it('does not falsely detect import statement', async () => {
        const sourceCode = `import math`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'os')).toBe(false);
    });

    it('does not falsely detect from-import statement', async () => {
        const sourceCode = `from collections import defaultdict`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'math')).toBe(false);
    });

    it('detects import with alias statement', async () => {
        const sourceCode = `import tensorflow as tf`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'tensorflow')).toBe(true);
    });

    it('detects import of specific item from package', async () => {
        const sourceCode = `from tensorflow.keras import models`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'tensorflow')).toBe(true);
    });

    it('detects multiple imports at once', async () => {
        const sourceCode = `import numpy, tensorflow`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'tensorflow')).toBe(true);
        expect(await checker.containsPackageImport(file, 'numpy')).toBe(true);
    });

    it('detects import with alias for specific items', async () => {
        const sourceCode = `from tensorflow.keras.models import Sequential as seq`;
        const file = {
            path: 'test.py',
            content: sourceCode
        };
        expect(await checker.containsPackageImport(file, 'tensorflow')).toBe(true);
    });
});
