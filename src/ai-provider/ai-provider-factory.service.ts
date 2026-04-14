import { Injectable } from "@nestjs/common";
import { LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import {
  AiProviderConfiguration,
  IAiProviderFactory,
} from "./interfaces/ai-provider-configuration.interface";
import {
  SUPPORTED_AI_PROVIDERS,
  DEFAULT_MODELS,
  SupportedAiProvider,
} from "../common/constants/supported-ai-providers.constant";

@Injectable()
export class AiProviderFactoryService implements IAiProviderFactory {
  resolveLanguageModel(
    providerConfiguration: AiProviderConfiguration,
  ): LanguageModelV1 {
    const selectedProviderName =
      providerConfiguration.providerName as SupportedAiProvider;
    const resolvedModelIdentifier =
      providerConfiguration.modelIdentifier ??
      DEFAULT_MODELS[selectedProviderName];

    switch (selectedProviderName) {
      case SUPPORTED_AI_PROVIDERS.OPENAI: {
        const openaiClient = createOpenAI({
          apiKey: providerConfiguration.apiKey,
        });
        return openaiClient(resolvedModelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.ANTHROPIC: {
        const anthropicClient = createAnthropic({
          apiKey: providerConfiguration.apiKey,
        });
        return anthropicClient(resolvedModelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.GROQ: {
        const groqClient = createGroq({
          apiKey: providerConfiguration.apiKey,
        });
        return groqClient(resolvedModelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.GOOGLE: {
        const googleClient = createGoogleGenerativeAI({
          apiKey: providerConfiguration.apiKey,
        });
        return googleClient(resolvedModelIdentifier);
      }

      case SUPPORTED_AI_PROVIDERS.MINIMAX: {
        // MiniMax uses OpenAI-compatible API at https://api.minimax.io/v1
        const minimaxClient = createOpenAI({
          apiKey: providerConfiguration.apiKey,
          baseURL: "https://api.minimax.io/v1",
        });
        return minimaxClient(resolvedModelIdentifier);
      }

      default:
        throw new Error(
          `Unsupported AI provider: ${providerConfiguration.providerName}`,
        );
    }
  }
}
