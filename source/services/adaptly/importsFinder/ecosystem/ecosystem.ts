import path from 'path';

export enum Ecosystems {
    Npm = 'npm',
    Pypi = 'pypi'
}

type EcosystemData = {
    regex: RegExp;
    ecosystem: Ecosystems;
};

export function getEcosystem(manifestFileName: string): Ecosystems | null {
    const ecosystemPatterns: EcosystemData[] = [
        {
            regex: /package\.json$/,
            ecosystem: Ecosystems.Npm
        },
        {
            regex: /poetry\.lock$/,
            ecosystem: Ecosystems.Pypi
        },
        {
            regex: /\w*-?requirements(-\w+)?\.txt$/,
            ecosystem: Ecosystems.Pypi
        }
    ];

    const baseFileName = path.basename(manifestFileName);
    let foundEcosystem = null;

    for (const ecosystemData of ecosystemPatterns) {
        if (ecosystemData.regex.test(baseFileName)) {
            foundEcosystem = ecosystemData.ecosystem;
            break;
        }
    }

    return foundEcosystem;
}
