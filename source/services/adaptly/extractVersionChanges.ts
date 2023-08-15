export function extractVersionChanges(changelog: string, version: string): string {
    // Split the changelog into lines
    const lines = changelog.split('\n');

    // Find the line index of the specified version
    const versionIndex = lines.findIndex((line) => line.trim().startsWith('#') && line.trim().endsWith(version));

    // If the version is not found, return the default message
    if (versionIndex === -1) {
        return 'Nothing has been changed. Everything will work perfectly';
    }

    // Find the index of the next header line, or use the end of the file if there's no next header
    const nextHeaderIndex = lines.slice(versionIndex + 1).findIndex((line) => line.trim().startsWith('#'));
    const endIndex = nextHeaderIndex !== -1 ? versionIndex + nextHeaderIndex + 1 : lines.length;

    // Extract the lines between the version header and the next header (or the end of the file)
    // Extract the lines between the version header and the next header (or the end of the file)
    const changes = lines
        .slice(versionIndex + 1, endIndex)
        .map((line) => line.trim())
        .join('\n')
        .trim();

    return changes || 'Nothing has been changed. Everything will work perfectly';
}
