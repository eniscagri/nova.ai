import type { Message } from '../../types/chat';
import type { AiProvider } from './AiProvider';

/** Offline-only provider used by component tests; it is never selected in production. */
export class MockProvider implements AiProvider {
  async health(): Promise<boolean> { return true; }
  async chat(messages: Message[], onDelta?: (delta: string) => void): Promise<string> {
    const text = messages.at(-1)?.content ?? '';
    const response = `Yerel test yanıtı: ${text}`;
    onDelta?.(response);
    return response;
  }
}
