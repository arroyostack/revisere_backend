import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import {
  ContractRiskAnalysisResultSchema,
  ContractRiskAnalysisResult,
} from "./schemas/contract-risk-analysis-result.schema";
import { AiProviderFactoryService } from "../ai-provider/ai-provider-factory.service";
import { AiProviderConfiguration } from "../ai-provider/interfaces/ai-provider-configuration.interface";
import { generateStructuredObject } from "../ai-provider/generate-structured-object";

@Injectable()
export class ContractRiskAnalysisService {
  constructor(private readonly aiProviderFactory: AiProviderFactoryService) {}

  async analyzeContractRisks(
    contractPlainText: string,
    providerConfiguration: AiProviderConfiguration,
  ): Promise<ContractRiskAnalysisResult> {
    const systemPrompt = `You are a legal risk analysis expert specializing in identifying potential risks and red flags in contracts.
Your task is to carefully analyze the contract text provided and identify all potential risks.

CRITICAL RULES:
1. Only identify risks that are EXPLICITLY present in the contract text
2. Do NOT infer, assume, or hallucinate any risks
3. Provide plain English explanations that a non-lawyer can understand
4. Include specific recommended actions for each identified risk
5. Categorize risks by severity: low, medium, or high
6. Consider aspects like: unbalanced terms, vague language, missing protections, unusual obligations, auto-renewal clauses, unlimited liability, etc.`;

    const userPrompt = `Analyze the following contract for potential risks and red flags.
Wrap the contract text in <contract_text> tags:

<contract_text>
${contractPlainText}
</contract_text>`;

    try {
      return await generateStructuredObject({
        aiProviderFactory: this.aiProviderFactory,
        providerConfiguration,
        schema: ContractRiskAnalysisResultSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new UnprocessableEntityException(
          `Failed to analyze contract risks: ${error.message}`,
        );
      }
      throw new UnprocessableEntityException(
        "Failed to analyze contract risks: Unknown error",
      );
    }
  }
}
