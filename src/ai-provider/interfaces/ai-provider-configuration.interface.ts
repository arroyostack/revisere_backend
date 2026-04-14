import { LanguageModelV1 } from 'ai';

export interface AiProviderConfiguration {
  providerName: string;
  apiKey: string;
  modelIdentifier?: string;
}

export interface IAiProviderFactory {
  resolveLanguageModel(configuration: AiProviderConfiguration): LanguageModelV1;
}
