export const userErrorPrefix = `Please, try again. Also, make sure that this development branch has the latest code from the parent branch by either rebasing or merging the parent branch into this branch. \n\nIf that did not help, please, report us the Error code: `;
export const internalErrorPrefix = 'Adaptly Error: ';

export type AdaptlyErrorValue = {
    code: string;
    message: string;
};

type ErrorKey =
    | 'fetchingPrInfo'
    | 'parsingJson'
    | 'retrievingGitHubUrl'
    | 'gettingFileContent'
    | 'gettingManifest'
    | 'gettingReleases'
    | 'fetchingParentCommitSha'
    | 'creatingTreeObjects'
    | 'creatingNewTree'
    | 'creatingNewCommit'
    | 'updatingBranchReference'
    | 'creatingAndPushingChanges'
    | 'gettingCommitHistory'
    | 'revertingCommit'
    | 'postingComment'
    | 'updatingComment'
    | 'retrievingComments'
    | 'deletingComment'
    | 'fetchingReviewComments'
    | 'postingReviewComment'
    | 'postingCommentReaction'
    | 'listingFiles'
    | 'gettingReleaseNotes'
    | 'repositoryNotInDatabase'
    | 'openAiFailedBreakingChanges'
    | 'openAiFailedRefactors'
    | 'dependencyUpdateNotFound'
    | 'unknownError'
    | 'requestMissingInformation'
    | 'getInstallationId'
    | 'createOctokit'
    | 'missingEnvironmentVariable'
    | 'openAiEmptyMessageContent'
    | 'couldNotResolvePathImport'
    | 'repoCheckoutError';

type ErrorEncodings = {
    [key in ErrorKey]: AdaptlyErrorValue;
};

export const ADAPTLY_ERRORS: ErrorEncodings = {
    fetchingPrInfo: {
        code: '1',
        message: 'Unable to fetch information for PR'
    },
    parsingJson: {
        code: '2',
        message: 'Unable to parse JSON'
    },
    retrievingGitHubUrl: {
        code: '3',
        message: 'Unable to retrieve the GitHub URL for package '
    },
    gettingFileContent: {
        code: '4',
        message: 'Unable to get file content for file '
    },
    gettingManifest: {
        code: '5',
        message: 'Not able to extract manifest files for this PR.'
    },
    gettingReleases: {
        code: '6',
        message: 'Not able to retrieve releases information from GitHub'
    },
    fetchingParentCommitSha: {
        code: '7',
        message: 'Unable to fetch the parent commit SHA for branch '
    },
    creatingTreeObjects: {
        code: '8',
        message: 'Unable to create tree objects for updated files '
    },
    creatingNewTree: {
        code: '9',
        message: 'Unable to create a new tree '
    },
    creatingNewCommit: {
        code: '10',
        message: 'Unable to create a new commit '
    },
    updatingBranchReference: {
        code: '11',
        message: 'Unable to update branch reference '
    },
    creatingAndPushingChanges: {
        code: '12',
        message: 'Unable to create commit and push changes '
    },
    gettingCommitHistory: {
        code: '13',
        message: 'Unable to retrieve commit history '
    },
    revertingCommit: {
        code: '14',
        message: 'Unable to revert the commit '
    },
    postingComment: {
        code: '15',
        message: 'Unable to post comment'
    },
    updatingComment: {
        code: '16',
        message: 'Unable to update comment'
    },
    retrievingComments: {
        code: '17',
        message: 'Unable to retrieve comments'
    },
    deletingComment: {
        code: '18',
        message: 'Unable to delete comment'
    },
    fetchingReviewComments: {
        code: '19',
        message: 'Unable to fetch review comments'
    },
    postingReviewComment: {
        code: '20',
        message: 'Unable to post a review comment'
    },
    postingCommentReaction: {
        code: '21',
        message: 'Unable to post a comment reaction'
    },
    listingFiles: {
        code: '22',
        message: 'Unable to list files for repository'
    },
    gettingReleaseNotes: {
        code: '23',
        message: 'Not able to retrieve release notes from GitHub'
    },
    repositoryNotInDatabase: {
        code: '24',
        message: 'Repository does not exist in Adaptly database'
    },
    openAiFailedBreakingChanges: {
        code: '25',
        message: 'OpenAI failed getting breaking changes'
    },
    openAiFailedRefactors: {
        code: '26',
        message: 'OpenAI failed getting refactors'
    },
    dependencyUpdateNotFound: {
        code: '27',
        message: 'Dependency update not found'
    },
    unknownError: {
        code: '29',
        message: 'Unknown error'
    },
    requestMissingInformation: {
        code: '30',
        message: 'Request is missing information'
    },
    getInstallationId: {
        code: '31',
        message: 'Unable to get installation ID'
    },
    createOctokit: {
        code: '32',
        message: 'Unable to create Octokit'
    },
    missingEnvironmentVariable: {
        code: '33',
        message: 'Missing environment variable'
    },
    openAiEmptyMessageContent: {
        code: '34',
        message: 'OpenAI returned empty message content'
    },
    couldNotResolvePathImport: {
        code: '35',
        message: 'Could not resolve path import'
    },
    repoCheckoutError: {
        code: '36',
        message: 'Could not checkout repository'
    }
};
