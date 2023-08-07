import { DependencyUpdate } from '../../pr-dependencies/getDependenciesUpdated';
import { moveCursorVersion } from '../findBreakingChanges';

describe('moveCursorVersion', () => {
    const dependencyUpdate: Pick<DependencyUpdate, 'dependencyName' | 'dependencyRepoUrl' | 'dependencyUrl' | 'dirName' | 'manifestFilename'> = {
        dependencyName: '@adaptly/changelog-generator',
        dependencyRepoUrl: 'github@adaptly/changelog-generator',
        dependencyUrl: 'npm@adaptly/changelog-generator',
        dirName: 'adaptly/changelog-generator',
        manifestFilename: 'package.json'
    };

    it('should move cursor the first time', () => {
        const update: DependencyUpdate = {
            ...dependencyUpdate,
            currentVersion: '1.0.0',
            cursorVersion: '1.0.0',
            targetVersion: '1.4.0',
            intermediaryVersions: ['1.1.0', '1.2.0', '1.3.0', '1.4.0']
        };

        const nextCursorVersion = moveCursorVersion(update);

        expect(nextCursorVersion).toEqual('1.1.0');
        expect(update.cursorVersion).toEqual('1.1.0');
    });

    it('should move cursor consecutive time', () => {
        const update: DependencyUpdate = {
            ...dependencyUpdate,
            currentVersion: '1.0.0',
            cursorVersion: '1.2.0',
            targetVersion: '1.4.0',
            intermediaryVersions: ['1.1.0', '1.2.0', '1.3.0', '1.4.0']
        };

        const nextCursorVersion = moveCursorVersion(update);

        expect(nextCursorVersion).toEqual('1.3.0');
        expect(update.cursorVersion).toEqual('1.3.0');
    });

    it('should move cursor to reach the end', () => {
        const update: DependencyUpdate = {
            ...dependencyUpdate,
            currentVersion: '1.0.0',
            cursorVersion: '1.4.0',
            targetVersion: '1.4.0',
            intermediaryVersions: ['1.1.0', '1.2.0', '1.3.0', '1.4.0']
        };

        const nextCursorVersion = moveCursorVersion(update);

        expect(nextCursorVersion).toEqual(undefined);
        expect(update.cursorVersion).toEqual('1.4.0');
    });
});
