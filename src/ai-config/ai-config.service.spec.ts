import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigService } from '@nestjs/config';
import { AiConfigService } from './ai-config.service';

test('AiConfigService returns configured provider values', () => {
  const nestConfigService = new ConfigService({
    AI_PROVIDER: 'openai',
    AI_API_KEY: 'test-api-key',
    AI_MODEL_IDENTIFIER: 'gpt-4o',
  });
  const aiConfigService = new AiConfigService(nestConfigService);

  assert.deepEqual(aiConfigService.getProviderConfiguration(), {
    providerName: 'openai',
    apiKey: 'test-api-key',
    modelIdentifier: 'gpt-4o',
  });
});

test('AiConfigService omits model identifier when it is not configured', () => {
  const nestConfigService = new ConfigService({
    AI_PROVIDER: 'anthropic',
    AI_API_KEY: 'test-api-key',
  });
  const aiConfigService = new AiConfigService(nestConfigService);

  assert.deepEqual(aiConfigService.getProviderConfiguration(), {
    providerName: 'anthropic',
    apiKey: 'test-api-key',
    modelIdentifier: undefined,
  });
});

test('AiConfigService throws when required provider configuration is missing', () => {
  const nestConfigService = new ConfigService({});
  const aiConfigService = new AiConfigService(nestConfigService);

  assert.throws(() => aiConfigService.getProviderConfiguration(), {
    message:
      'AI_PROVIDER and AI_API_KEY environment variables must be configured. See .env.example for configuration options.',
  });
});
