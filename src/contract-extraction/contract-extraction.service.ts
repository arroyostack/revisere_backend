import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import {
  ExtractedContractDataSchema,
  ExtractedContractData,
} from "./schemas/extracted-contract-data.schema";
import { AiProviderFactoryService } from "../ai-provider/ai-provider-factory.service";
import { AiProviderConfiguration } from "../ai-provider/interfaces/ai-provider-configuration.interface";
import { generateStructuredObject } from "../ai-provider/generate-structured-object";

@Injectable()
export class ContractExtractionService {
  constructor(private readonly aiProviderFactory: AiProviderFactoryService) {}

  async extractContractData(
    contractPlainText: string,
    providerConfiguration: AiProviderConfiguration,
  ): Promise<ExtractedContractData> {
    const systemPrompt = `You are a legal document analysis expert specializing in extracting structured data from contracts.
Your task is to carefully analyze the contract text provided and extract all relevant information into the specified JSON format.

CRITICAL RULES:
1. Only extract information that is EXPLICITLY present in the contract text
2. Do NOT infer, assume, or hallucinate any information
3. If information is not present in the contract, use null or appropriate default values
4. Be precise with dates, names, and legal terminology
5. Extract ALL parties mentioned in the contract
6. Identify all key obligations with their respective parties
7. Determine the presence of important clauses (confidentiality, non-compete, IP) based on explicit text`;

    const userPrompt = `Extract the structured contract data from the following contract text.
Wrap the contract text in <contract_text> tags:

<contract_text>
${contractPlainText}
</contract_text>`;

    try {
      return await generateStructuredObject({
        aiProviderFactory: this.aiProviderFactory,
        providerConfiguration,
        schema: ExtractedContractDataSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new UnprocessableEntityException(
          `Failed to extract contract data: ${error.message}`,
        );
      }
      throw new UnprocessableEntityException(
        "Failed to extract contract data: Unknown error",
      );
    }
  }
}
