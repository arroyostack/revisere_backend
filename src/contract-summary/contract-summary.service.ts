import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import {
  ContractSummaryResultSchema,
  ContractSummaryResult,
} from "./schemas/contract-summary-result.schema";
import { AiProviderFactoryService } from "../ai-provider/ai-provider-factory.service";
import { AiProviderConfiguration } from "../ai-provider/interfaces/ai-provider-configuration.interface";
import { generateStructuredObject } from "../ai-provider/generate-structured-object";

@Injectable()
export class ContractSummaryService {
  constructor(private readonly aiProviderFactory: AiProviderFactoryService) {}

  async summarizeContract(
    contractPlainText: string,
    providerConfiguration: AiProviderConfiguration,
  ): Promise<ContractSummaryResult> {
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
      return await generateStructuredObject({
        aiProviderFactory: this.aiProviderFactory,
        providerConfiguration,
        schema: ContractSummaryResultSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new UnprocessableEntityException(
          `Failed to summarize contract: ${error.message}`,
        );
      }
      throw new UnprocessableEntityException(
        "Failed to summarize contract: Unknown error",
      );
    }
  }
}
