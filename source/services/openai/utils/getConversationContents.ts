import { ChatCompletionRequestMessage } from 'openai';

export function getConversationContents(conversation: ChatCompletionRequestMessage[]): string[] {
    const messages = conversation.map((message) => message.content);

    return messages.filter((message) => message !== undefined) as string[];
}
