export type Dependencies = {
    [key: string]: string;
};

export interface DependenciesParser {
    parseDependencies(manifestContent: string): Dependencies;
    getDependencyRepoUrl(packageName: string): Promise<string>;
    getDependencyUrl(packageName: string): string;
}
