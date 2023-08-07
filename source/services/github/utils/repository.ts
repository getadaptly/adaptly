export function getRepositoryOwnerAndName(repositoryFullName: string): [string, string] {
    const [owner, name] = repositoryFullName.split('/');

    return [owner, name];
}
