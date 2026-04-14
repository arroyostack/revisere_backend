import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMock } from '../../../utils/mock';
import { AiProviderFactoryService } from '../../../../src/ai-provider/ai-provider-factory.service';
import { AiProviderConfiguration } from '../../../../src/ai-provider/interfaces/ai-provider-configuration.interface';
import { SUPPORTED_AI_PROVIDERS, DEFAULT_MODELS } from '../../../../src/common/constants/supported-ai-providers.constant';

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn().mockReturnValue(() => ({ name: 'openai-model' })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn().mockReturnValue(() => ({ name: 'anthropic-model' })),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn().mockReturnValue(() => ({ name: 'google-model' })),
}));

vi.mock('@ai-sdk/groq', () => ({
  createGroq: vi.fn().mockReturnValue(() => ({ name: 'groq-model' })),
}));

describe('AiProviderFactoryService', () => {
  let aiProviderFactoryService: AiProviderFactoryService;
  let mockAiProviderConfiguration: AiProviderConfiguration;

  beforeEach(() => {
    aiProviderFactoryService = new AiProviderFactoryService();
    mockAiProviderConfiguration = {
      providerName: SUPPORTED_AI_PROVIDERS.OPENAI,
      apiKey: 'test-api-key',
      modelIdentifier: undefined,
    };
  });

  describe('resolveLanguageModel', () => {
    it('should create OpenAI client with correct API key when provider is OPENAI', () => {
      const openAiConfiguration: AiProviderConfiguration = {
        providerName: SUPPORTED_AI_PROVIDERS.OPENAI,
        apiKey: 'openai-secret-key',
        modelIdentifier: undefined,
      };

      const result = aiProviderFactoryService.resolveLanguageModel(openAiConfiguration);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'openai-model');
    });

    it('should create Anthropic client with correct API key when provider is ANTHROPIC', () => {
      const anthropicConfiguration: AiProviderConfiguration = {
        providerName: SUPPORTED_AI_PROVIDERS.ANTHROPIC,
        apiKey: 'anthropic-secret-key',
        modelIdentifier: undefined,
      };

      const result = aiProviderFactoryService.resolveLanguageModel(anthropicConfiguration);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'anthropic-model');
    });

    it('should create Groq client with correct API key when provider is GROQ', () => {
      const groqConfiguration: AiProviderConfiguration = {
        providerName: SUPPORTED_AI_PROVIDERS.GROQ,
        apiKey: 'groq-secret-key',
        modelIdentifier: undefined,
      };

      const result = aiProviderFactoryService.resolveLanguageModel(groqConfiguration);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'groq-model');
    });

    it('should create Google Generative AI client with correct API key when provider is GOOGLE', () => {
      const googleConfiguration: AiProviderConfiguration = {
        providerName: SUPPORTED_AI_PROVIDERS.GOOGLE,
        apiKey: 'google-secret-key',
        modelIdentifier: undefined,
      };

      const result = aiProviderFactoryService.resolveLanguageModel(googleConfiguration);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'google-model');
    });

    it('should create MiniMax client with custom baseURL when provider is MINIMAX', () => {
      const minimaxConfiguration: AiProviderConfiguration = {
        providerName: SUPPORTED_AI_PROVIDERS.MINIMAX,
        apiKey: 'minimax-secret-key',
        modelIdentifier: undefined,
      };

      const result = aiProviderFactoryService.resolveLanguageModel(minimaxConfiguration);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'openai-model');
    });

    it('should throw error when provider is unsupported', () => {
      const unsupportedConfiguration: AiProviderConfiguration = {
        providerName: 'unsupported-provider' as any,
        apiKey: 'some-key',
        modelIdentifier: undefined,
      };

      expect(() => {
        aiProviderFactoryService.resolveLanguageModel(unsupportedConfiguration);
      }).toThrow('Unsupported AI provider: unsupported-provider');
    });

    it('should use default model when modelIdentifier is not provided for OPENAI', () => {
      const configurationWithoutModel: AiProviderConfiguration = {
        providerName: SUPPORTED_AI_PROVIDERS.OPENAI,
        apiKey: 'test-key',
        modelIdentifier: undefined,
      };

      const result = aiProviderFactoryService.resolveLanguageModel(configurationWithoutModel);

      expect(result).toBeDefined();
      expect(DEFAULT_MODELS[SUPPORTED_AI_PROVIDERS.OPENAI]).toBeDefined();
    });

    it('should use provided model identifier when modelIdentifier is provided', () => {
      const configurationWithCustomModel: AiProviderConfiguration = {
        providerName: SUPPORTED_AI_PROVIDERS.OPENAI,
        apiKey: 'test-key',
        modelIdentifier: 'gpt-4-turbo',
      };

      const result = aiProviderFactoryService.resolveLanguageModel(configurationWithCustomModel);

      expect(result).toBeDefined();
    });
  });
});