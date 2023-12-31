const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    setupFilesAfterEnv: ['<rootDir>/jest.globalSetup.js'],
    testPathIgnorePatterns: ['node_modules/**/*', 'tmp/**/*']
};
