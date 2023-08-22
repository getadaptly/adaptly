import { gql } from 'graphql-request';

export const queryRepository = gql`
    query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
            name
            nameWithOwner
            stargazerCount
            isArchived
            primaryLanguage {
                name
            }
        }
    }
`;

export type GitHubRepository = QueryRepository['repository'];

export type QueryRepository = {
    repository: {
        name: string;
        nameWithOwner: string;
        stargazerCount: number;
        isArchived: boolean;
        primaryLanguage: {
            name: string;
        };
    };
};
