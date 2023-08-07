export function getAbsolutePathInRepo(absolutePath: string, repoName: string): string {
    const repoIndex = absolutePath.indexOf(repoName);

    if (repoIndex !== -1) {
        return absolutePath.substring(repoIndex + repoName.length + 1);
    }

    return '';
}
