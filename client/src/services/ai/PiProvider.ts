import type { Message } from '../../types/chat';
import type { AiProvider } from './AiProvider';

/** Direct browser-to-Pi communication is intentionally prohibited: it could expose a secret. */
export class PiProvider implements AiProvider {
  async health(): Promise<boolean> { return false; }
  async chat(_messages: Message[], _onDelta?: (delta: string) => void): Promise<string> {
    throw new Error('Pi.ai direct client integration is unavailable without an officially documented public API.');
  }
}
