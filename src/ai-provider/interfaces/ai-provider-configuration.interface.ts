import { LanguageModelV1 } from "ai";

export interface AiProviderConfiguration {
  providerName: string;
  apiKey: string;
  modelIdentifier?: string;
}

export interface IAiProviderFactory {
  resolveLanguageModel(
    providerConfiguration: AiProviderConfiguration,
  ): LanguageModelV1;
}
