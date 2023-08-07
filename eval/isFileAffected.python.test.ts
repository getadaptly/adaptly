import { isFileAffected } from '@adaptly/events/issue_handler/actions/created/commands/go/source/refactors/findRefactors';

describe('isFileAffected function', () => {
    const testCases = [
        {
            packageName: 'pandas',
            breakingChange: {
                title: 'rename is_terminal method to is_interactive',
                description:
                    'The is_terminal method has been deprecated and removed from pandas after version 1.0.0. It has been replaced by the is_interactive method. You should replace all calls to pd.io.formats.console.is_terminal with pd.io.formats.console.is_interactive to maintain the same functionality.'
            },
            file: {
                path: 'pandas_test.py',
                content: `
                    import pandas as pd
                    terminal = pd.io.formats.console.is_terminal()
                `
            },
            expected: true
        },
        {
            packageName: 'pandas',
            breakingChange: {
                title: 'rename is_terminal method to is_interactive',
                description:
                    'The is_terminal method has been deprecated and removed from pandas after version 1.0.0. It has been replaced by the is_interactive method. You should replace all calls to pd.io.formats.console.is_terminal with pd.io.formats.console.is_interactive to maintain the same functionality.'
            },
            file: {
                path: 'pandas_test2.py',
                content: `
                    import pandas as pd
                    interactive = pd.io.formats.console.is_interactive()
                `
            },
            expected: false
        },
        {
            packageName: 'pandas',
            breakingChange: {
                title: 'removal of SparseDataFrame',
                description:
                    'SparseDataFrame was removed in version 1.0.0. DataFrame now always has sparse columns, so you no longer need the SparseDataFrame class. You can just use the regular DataFrame class instead.'
            },
            file: {
                path: 'pandas_test3.py',
                content: `
                    import pandas as pd
                    s = pd.SparseDataFrame({'A': [0, 1]})
                `
            },
            expected: true
        },
        {
            packageName: 'pandas',
            breakingChange: {
                title: 'removal of SparseDataFrame',
                description:
                    'SparseDataFrame was removed in version 1.0.0. DataFrame now always has sparse columns, so you no longer need the SparseDataFrame class. You can just use the regular DataFrame class instead.'
            },
            file: {
                path: 'pandas_test4.py',
                content: `
                    import pandas as pd
                    df = pd.DataFrame({'A': [0, 1]})
                `
            },
            expected: false
        },
        {
            packageName: 'numpy',
            breakingChange: {
                title: 'numpy.matrix deprecation',
                description:
                    'In numpy 1.15, the numpy.matrix is deprecated. It is no longer recommended to use this class, even for linear algebra. Instead use regular arrays. The class may be removed in the future.'
            },
            file: {
                path: 'numpy_test.py',
                content: `
                    import numpy as np
                    const a = np.matrix([[1, 2], [3, 4]])
                    const invA = a.I
                `
            },
            expected: true
        },
        {
            packageName: 'numpy',
            breakingChange: {
                title: 'numpy.matrix deprecation',
                description:
                    'In numpy 1.15, the numpy.matrix is deprecated. It is no longer recommended to use this class, even for linear algebra. Instead use regular arrays. The class may be removed in the future.'
            },
            file: {
                path: 'numpy_test2.py',
                content: `
                    import numpy as np
                    const a = np.array([[1, 2], [3, 4]])
                    const invA = np.linalg.inv(a)
                `
            },
            expected: false
        },
        {
            packageName: 'matplotlib',
            breakingChange: {
                title: 'Default value of the align parameter of the bar API',
                description:
                    'The bar() and barh() functions now default to align="center" but this can cause a breaking change if your code relies on the old default of align="edge". To revert to the old behavior, you can explicitly set align="edge".'
            },
            file: {
                path: 'matplotlib_test.py',
                content: `
                    import matplotlib.pyplot as plt
                    const values = [2, 5, 3, 4]
                    plt.bar(range(len(values)), values)
                    plt.show()
                `
            },
            expected: true
        },
        {
            packageName: 'matplotlib',
            breakingChange: {
                title: 'Default value of the align parameter of the bar API',
                description:
                    'The bar() and barh() functions now default to align="center" but this can cause a breaking change if your code relies on the old default of align="edge". To revert to the old behavior, you can explicitly set align="edge".'
            },
            file: {
                path: 'matplotlib_test2.py',
                content: `
                    import matplotlib.pyplot as plt
                    const values = [2, 5, 3, 4]
                    plt.bar(range(len(values)), values, { align: 'edge' })
                    plt.show()
                `
            },
            expected: false
        }
    ];

    testCases.forEach(({ packageName, breakingChange, file, expected }) => {
        const oneHourTimeout = 3600000;
        test(
            `should return ${expected} for ${file.path} and ${breakingChange.title}`,
            async () => {
                const isAffected = await isFileAffected(packageName, breakingChange, file);
                expect(isAffected).toBe(expected);
            },
            oneHourTimeout
        );
    });
});
