import { encode } from 'gpt-3-encoder';
import { MAX_NUM_TOKENS_8K } from '../client';

export function fitsInGPT4(content: string): boolean {
    const encoded = encode(content);
    return encoded.length <= MAX_NUM_TOKENS_8K;
}
