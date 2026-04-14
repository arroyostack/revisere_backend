import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { generateObject } from 'ai';
import { ContractComparisonResultSchema, ContractComparisonResult } from './schemas/contract-comparison-result.schema';
import { AiProviderFactoryService } from '../ai-provider/ai-provider-factory.service';
import { AiProviderConfiguration } from '../ai-provider/interfaces/ai-provider-configuration.interface';

@Injectable()
export class ContractComparisonService {
  constructor(private readonly aiProviderFactory: AiProviderFactoryService) {}

  async compareContracts(
    firstContractPlainText: string,
    secondContractPlainText: string,
    providerConfiguration: AiProviderConfiguration,
  ): Promise<ContractComparisonResult> {
    const languageModel = this.aiProviderFactory.resolveLanguageModel(providerConfiguration);

    const systemPrompt = `You are a legal document comparison expert specializing in identifying differences between contract versions.
Your task is to carefully analyze both contract versions and identify all changes, additions, and deletions.

CRITICAL RULES:
1. Only identify changes that are EXPLICITLY present in the contract text
2. Do NOT infer, assume, or hallucinate any changes
3. Provide plain English explanations that a non-lawyer can understand
4. Assess the significance and direction of each change
5. Determine which version is more favorable overall
6. Provide specific recommendations before signing`;

    const userPrompt = `Compare the following two contracts and identify all changes.
Wrap each contract in <contract_text> tags:

<contract_text>
${firstContractPlainText}
</contract_text>

---

<contract_text>
${secondContractPlainText}
</contract_text>

The first contract is the "Original" version.
The second contract is the "Revised" version.`;

    try {
      const result = await generateObject({
        model: languageModel,
        schema: ContractComparisonResultSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      return result.object;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnprocessableEntityException(
          `Failed to compare contracts: ${error.message}`,
        );
      }
      throw new UnprocessableEntityException(
        'Failed to compare contracts: Unknown error',
      );
    }
  }
}
