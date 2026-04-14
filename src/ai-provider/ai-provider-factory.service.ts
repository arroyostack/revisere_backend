import { Injectable } from '@nestjs/common';
import { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { AiProviderConfiguration, IAiProviderFactory } from './interfaces/ai-provider-configuration.interface';
import {
  SUPPORTED_AI_PROVIDERS,
  DEFAULT_MODELS,
  SupportedAiProvider,
} from '../common/constants/supported-ai-providers.constant';

@Injectable()
export class AiProviderFactoryService implements IAiProviderFactory {
  resolveLanguageModel(configuration: AiProviderConfiguration): LanguageModelV1 {
    const providerName = configuration.providerName as SupportedAiProvider;
    const modelIdentifier = configuration.modelIdentifier || DEFAULT_MODELS[providerName];

    switch (providerName) {
      case SUPPORTED_AI_PROVIDERS.OPENAI: {
        const openaiClient = createOpenAI({
          apiKey: configuration.apiKey,
        });
        return openaiClient(modelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.ANTHROPIC: {
        const anthropicClient = createAnthropic({
          apiKey: configuration.apiKey,
        });
        return anthropicClient(modelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.GROQ: {
        const groqClient = createGroq({
          apiKey: configuration.apiKey,
        });
        return groqClient(modelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.GOOGLE: {
        const googleClient = createGoogleGenerativeAI({
          apiKey: configuration.apiKey,
        });
        return googleClient(modelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.MINIMAX: {
        const minimaxClient = createOpenAI({
          apiKey: configuration.apiKey,
          baseURL: 'https://api.minimax.chat/v1',
        });
        return minimaxClient(modelIdentifier);
      }

      default:
        throw new Error(`Unsupported AI provider: ${configuration.providerName}`);
    }
  }
}
