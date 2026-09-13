import type { AiMessage, AiProvider, AiResponse } from './AiProvider.js';

/**
 * Reserved boundary for a future officially documented Pi.ai business API.
 * It deliberately makes no network call: no public endpoint, auth contract,
 * request schema or model identifier was verified during project creation.
 */
export class PiProvider implements AiProvider {
  readonly name = 'pi-unavailable';
  readonly supportsStreaming = false;
  readonly isConfigured = false;
  async chat(_messages: AiMessage[], _signal: AbortSignal): Promise<AiResponse> {
    throw new Error('Pi.ai public chatbot API is not configured because official API documentation was not verified.');
  }
}
