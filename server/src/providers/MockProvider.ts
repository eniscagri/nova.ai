import type { AiMessage, AiProvider, AiResponse } from './AiProvider.js';

/** A deterministic local provider for UI, integration and offline development. */
export class MockProvider implements AiProvider {
  readonly name = 'local-mock';
  readonly supportsStreaming = false;
  readonly isConfigured = true;
  async chat(messages: AiMessage[], _signal: AbortSignal): Promise<AiResponse> {
    const last = [...messages].reverse().find((message) => message.role === 'user')?.content.trim();
    if (!last) throw new Error('Empty user message');
    return { model: 'local-mock', content: `Mesajını aldım: **${last.replace(/</g, '&lt;').replace(/>/g, '&gt;')}**\n\nPi.ai için resmi, herkese açık sohbet API dokümantasyonu doğrulanamadığından bu geliştirme yanıtı yalnızca yerel sağlayıcıdan gelir.` };
  }
}
