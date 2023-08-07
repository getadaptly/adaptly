import { isFileAffected } from '@adaptly/events/issue_handler/actions/created/commands/go/source/refactors/findRefactors';

describe('isFileAffected function', () => {
    const testCases = [
        {
            packageName: 'lodash',
            breakingChange: {
                title: '_.pluck removal',
                description: 'Removed `_.pluck` method.'
            },
            file: {
                path: 'lodash_test.ts',
                content: `
                    const _ = require('lodash');
                    const objects = [{ 'a': 1 }, { 'a': 2 }];
                    _.pluck(objects, 'a');
                `
            },
            expected: true
        },
        {
            packageName: 'express',
            breakingChange: {
                title: 'app.configure removal',
                description:
                    'The `app.configure()` method, which was used for configuring settings for specific environments, has been removed. You should now directly use the `app.set()` method to set configuration variables, and implement your own logic to handle environment-specific settings.'
            },
            file: {
                path: 'express_test.ts',
                content: `
                    const express = require('express');
                    const app = express();

                    app.configure(function() {
                        app.use(express.logger('dev'));
                        app.use(express.bodyParser());
                    });
                `
            },
            expected: true
        },
        {
            packageName: 'express',
            breakingChange: {
                title: 'app.configure removal',
                description:
                    'The `app.configure()` method, which was used for configuring settings for specific environments, has been removed. You should now directly use the `app.set()` method to set configuration variables, and implement your own logic to handle environment-specific settings.'
            },
            file: {
                path: 'express_test2.ts',
                content: `
                    const express = require('express');
                    const app = express();

                    app.set('views', path.join(__dirname, 'views'));
                    app.set('view engine', 'jade');

                    app.get('/', function (req, res) {
                        res.send('Hello World!')
                    });

                    app.listen(3000);
                `
            },
            expected: false
        },
        {
            packageName: 'express',
            breakingChange: {
                title: 'res.json signature change',
                description: 'The `res.json(status, obj)` signature was removed. You should now use `res.status(status).json(obj)` instead.'
            },
            file: {
                path: 'express_test3.ts',
                content: `
                    const express = require('express');
                    const app = express();

                    app.get('/', function (req, res) {
                        res.json(200, { message: 'Hello World!' });
                    });

                    app.listen(3000);
                `
            },
            expected: true
        },
        {
            packageName: 'express',
            breakingChange: {
                title: 'res.json signature change',
                description: 'The `res.json(status, obj)` signature was removed. You should now use `res.status(status).json(obj)` instead.'
            },
            file: {
                path: 'express_test4.ts',
                content: `
                    const express = require('express');
                    const app = express();

                    app.get('/', function (req, res) {
                        res.json({ message: 'Hello World!' });
                    });

                    app.listen(3000);
                `
            },
            expected: false
        },
        {
            packageName: '@prisma/client',
            breakingChange: {
                title: 'Rename findOne to findUnique',
                description:
                    'This release renames findOne to findUnique and deprecates findOne. We made this change to reduce confusion. Many people expected findOne to be more loose, e.g: "Find the first record that matches my conditions.". The @prisma/codemods workflow describe above will automatically rename findOne to findUnique across your codebase.'
            },
            file: {
                path: 'prisma_test.ts',
                content: `
                    import { PrismaClient } from "@prisma/client";

                    const prisma = new PrismaClient();

                    export async function getUserById(id: number) {
                      const user = await prisma.user.findOne({ where: { id } });
                      return user;
                    }

                    export async function createUser(name: string) {
                      const user = await prisma.user.create({ data: { name } });
                      return user;
                    }

                    export async function updateUser(id: number, name: string) {
                      const user = await prisma.user.update({ where: { id }, data: { name } });
                      return user;
                    }

                    export async function deleteUser(id: number) {
                      const user = await prisma.user.delete({ where: { id } });
                      return user;
                    }
                `
            },
            expected: true
        },
        {
            packageName: '@prisma/client',
            breakingChange: {
                title: 'Dropped support for Node 12',
                description: 'The minimum version of Node.js Prisma will support is 14.17.x.'
            },
            file: {
                path: 'prisma_test.ts',
                content: `
                    import { PrismaClient } from "@prisma/client";

                    const prisma = new PrismaClient();

                    export async function getUserById(id: number) {
                      const user = await prisma.user.findOne({ where: { id } });
                      return user;
                    }

                    export async function createUser(name: string) {
                      const user = await prisma.user.create({ data: { name } });
                      return user;
                    }

                    export async function updateUser(id: number, name: string) {
                      const user = await prisma.user.update({ where: { id }, data: { name } });
                      return user;
                    }

                    export async function deleteUser(id: number) {
                      const user = await prisma.user.delete({ where: { id } });
                      return user;
                    }
                `
            },
            expected: false
        },
        {
            packageName: '@prisma/client',
            breakingChange: {
                title: 'Explicit unique constraints for 1:1 relations',
                description:
                    'From version 4.0.0, 1:1 relations are now required to be marked with the @unique attribute on the side of the relationship that contains the foreign key.'
            },
            file: {
                path: 'user.ts',
                content: `
                    import { PrismaClient } from "@prisma/client";

                    const prisma = new PrismaClient();

                    export async function getUserByEmail(email: string) {
                      const user = await prisma.user.findUnique({ where: { email } });

                      if (user === null) {
                        throw new Error(\`No user found for email: \\$\\{email}\`);
                      }

                      return user;
                    }

                    export async function createUser(name: string, email: string) {
                      const user = await prisma.user.create({ data: { name, email } });
                      return user;
                    }

                    export async function updateUser(id: number, name: string) {
                      const user = await prisma.user.update({ where: { id }, data: { name } });
                      return user;
                    }

                    export async function deleteUser(id: number) {
                      const user = await prisma.user.delete({ where: { id } });
                      return user;
                    }
                `
            },
            expected: false
        },
        {
            packageName: '@prisma/client',
            breakingChange: {
                title: 'Deprecating `rejectOnNotFound`',
                description:
                    'The rejectOnNotFound parameter is deprecated in favor of the new findUniqueOrThrow and findFirstOrThrow Prisma Client APIs.'
            },
            file: {
                path: 'user.ts',
                content: `
                    import { PrismaClient } from "@prisma/client";
                    
                    const prisma = new PrismaClient();
                    
                    export async function getUserByEmail(email: string) {
                      const user = await prisma.user.findUnique({ where: { email } });
                    
                      if (user === null) {
                        throw new Error(\`No user found for email: \\$\\{email}\`);
                      }
                    
                      return user;
                    }
                    
                    export async function createUser(name: string, email: string) {
                      const user = await prisma.user.create({ data: { name, email } });
                      return user;
                    }
                    
                    export async function updateUser(id: number, name: string) {
                      const user = await prisma.user.update({ where: { id }, data: { name } });
                      return user;
                    }
                    
                    export async function deleteUser(id: number) {
                      const user = await prisma.user.delete({ where: { id } });
                      return user;
                    }
                `
            },
            expected: false
        },
        {
            packageName: '@prisma/client',
            breakingChange: {
                title: 'Rename findOne to findUnique',
                description:
                    'The findOne method has been renamed to findUnique and is deprecated. Use the @prisma/codemods package to automatically rename findOne to findUnique across your codebase.'
            },
            file: {
                path: 'stats.ts',
                content: `
                import { PrismaClient } from "@prisma/client";

                const prisma = new PrismaClient();
                
                export async function getUserCount() {
                  const count = await prisma.user.count();
                  return count;
                }
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
