import { RoleSystem } from '../types';
import { getConversationContents } from './getConversationContents';
import { tokenCount } from './tokenCount';
import { ChatCompletionRequestMessage } from 'openai';

describe('tokenCount', () => {
    it('should return correct token count for gpt-3.5-turbo model', () => {
        const conversation: (ChatCompletionRequestMessage & { tokenCount: number })[] = [
            {
                content:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
                role: RoleSystem,
                tokenCount: 96
            },
            {
                content:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                role: RoleSystem,
                tokenCount: 45
            }
        ];

        const conversationContents = getConversationContents(conversation);
        const result = tokenCount(conversationContents, 'gpt-3.5-turbo-16k-0613');

        // Replace with expected token count for the given conversation and model
        const expectedTokenCount = conversation.reduce((acc, message) => acc + message.tokenCount, 0);

        expect(result).toBe(expectedTokenCount);
    });

    it('should return correct token count for gpt-4 model', () => {
        const conversation: (ChatCompletionRequestMessage & { tokenCount: number })[] = [
            {
                content:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
                role: RoleSystem,
                tokenCount: 96
            },
            {
                content:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                role: RoleSystem,
                tokenCount: 45
            }
        ];

        const conversationContents = getConversationContents(conversation);
        const result = tokenCount(conversationContents, 'gpt-4-0613');

        // Replace with expected token count for the given conversation and model
        const expectedTokenCount = conversation.reduce((acc, message) => acc + message.tokenCount, 0);

        expect(result).toBe(expectedTokenCount);
    });
});
