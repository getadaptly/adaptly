import { gql } from 'graphql-request';

export const QueryPullRequests = gql`
    query ($organization: String!, $repoName: String!, $after: String) {
        repository(owner: $organization, name: $repoName) {
            pullRequests(first: 100, after: $after) {
                nodes {
                    title
                    number
                    body
                    url
                    merged
                    state
                    createdAt
                    closedAt
                    mergedAt
                    author {
                        login
                    }
                    mergedBy {
                        login
                        url
                    }
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }
`;

export type GitHubPullRequest = QueryPullRequestsReturn['repository']['pullRequests']['nodes'][number];

export type QueryPullRequestsReturn = {
    repository: {
        pullRequests: {
            nodes: {
                title: string;
                number: number;
                body: string;
                url: string;
                merged: boolean;
                state: 'OPEN' | 'CLOSED' | 'MERGED';
                createdAt: string;
                closedAt: string | null;
                mergedAt: string | null;
                author: {
                    login: string;
                };
                mergedBy?: {
                    login: string;
                    url: string;
                };
            }[];
            pageInfo: {
                endCursor: string;
                hasNextPage: boolean;
            };
        };
    };
};
