import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProviderConfiguration } from '../ai-provider/interfaces/ai-provider-configuration.interface';

@Injectable()
export class AiConfigService {
  constructor(private readonly configService: ConfigService) {}

  getProviderConfiguration(): AiProviderConfiguration {
    const providerName = this.configService.get<string>('AI_PROVIDER');
    const apiKey = this.configService.get<string>('AI_API_KEY');
    const modelIdentifier = this.configService.get<string>('AI_MODEL_IDENTIFIER');

    if (!providerName || !apiKey) {
      throw new Error(
        'AI_PROVIDER and AI_API_KEY environment variables must be configured. ' +
        'See .env.example for configuration options.',
      );
    }

    return {
      providerName,
      apiKey,
      modelIdentifier: modelIdentifier || undefined,
    };
  }
}