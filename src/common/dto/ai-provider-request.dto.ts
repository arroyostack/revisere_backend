import { z } from 'zod';
import { SUPPORTED_AI_PROVIDERS } from '../constants/supported-ai-providers.constant';

export const AiProviderRequestDtoSchema = z.object({
  providerName: z.enum([
    SUPPORTED_AI_PROVIDERS.OPENAI,
    SUPPORTED_AI_PROVIDERS.ANTHROPIC,
    SUPPORTED_AI_PROVIDERS.GROQ,
    SUPPORTED_AI_PROVIDERS.GOOGLE,
    SUPPORTED_AI_PROVIDERS.MINIMAX,
  ]),
  apiKey: z.string().min(1, 'API key is required'),
  modelIdentifier: z.string().optional(),
});

export type AiProviderRequestDto = z.infer<typeof AiProviderRequestDtoSchema>;
