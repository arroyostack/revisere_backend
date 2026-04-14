import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { generateObject } from 'ai';
import { ContractSummaryResultSchema, ContractSummaryResult } from './schemas/contract-summary-result.schema';
import { AiProviderFactoryService } from '../ai-provider/ai-provider-factory.service';
import { AiProviderConfiguration } from '../ai-provider/interfaces/ai-provider-configuration.interface';

@Injectable()
export class ContractSummaryService {
  constructor(private readonly aiProviderFactory: AiProviderFactoryService) {}

  async summarizeContract(
    contractPlainText: string,
    providerConfiguration: AiProviderConfiguration,
  ): Promise<ContractSummaryResult> {
    const languageModel = this.aiProviderFactory.resolveLanguageModel(providerConfiguration);

    const systemPrompt = `You are a legal document simplification expert specializing in explaining contracts in plain language.
Your task is to carefully analyze the contract text provided and create a comprehensive, easy-to-understand summary.

CRITICAL RULES:
1. Only use information that is EXPLICITLY present in the contract text
2. Do NOT infer, assume, or hallucinate any information
3. Write in plain language that a non-lawyer can understand
4. Focus on practical, actionable information
5. Be honest about what you don't know from the contract
6. Provide the summary in the exact JSON format requested`;

    const userPrompt = `Create a plain English summary of the following contract.
Wrap the contract text in <contract_text> tags:

<contract_text>
${contractPlainText}
</contract_text>`;

    try {
      const result = await generateObject({
        model: languageModel,
        schema: ContractSummaryResultSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      return result.object;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnprocessableEntityException(
          `Failed to summarize contract: ${error.message}`,
        );
      }
      throw new UnprocessableEntityException(
        'Failed to summarize contract: Unknown error',
      );
    }
  }
}
