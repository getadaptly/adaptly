import { encoding_for_model } from '@dqbd/tiktoken';

import { ChatCompletionRequestMessage } from 'openai';

const enc4 = encoding_for_model('gpt-4');
const enc35 = encoding_for_model('gpt-3.5-turbo');

export function tokenCount(texts: string[], model: 'gpt-3.5-turbo-16k-0613' | 'gpt-4-0613'): number {
    let length = 0;

    const enc = model === 'gpt-3.5-turbo-16k-0613' ? enc35 : enc4;

    for (let text of texts) {
        length += enc.encode(text).length;
    }

    return length;
}
