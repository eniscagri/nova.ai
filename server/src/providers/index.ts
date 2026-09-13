import type { AiProvider } from './AiProvider.js';
import { MockProvider } from './MockProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { PiProvider } from './PiProvider.js';

export function createProvider(name: string | undefined): AiProvider {
  switch (name?.toLowerCase()) {
    case 'mock': return new MockProvider();
    case 'pi': return new PiProvider();
    case 'openai':
    default: return new OpenAIProvider(process.env.OPENAI_MODEL ?? 'gpt-5.2', process.env.OPENAI_API_KEY);
  }
}
