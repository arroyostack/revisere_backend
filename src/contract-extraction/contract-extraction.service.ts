import { Injectable, Logger } from "@nestjs/common";
import {
  ExtractedContractDataSchema,
  ExtractedContractData,
} from "./schemas/extracted-contract-data.schema";
import { AiProviderFactoryService } from "../ai-provider/ai-provider-factory.service";
import { AiProviderConfiguration } from "../ai-provider/interfaces/ai-provider-configuration.interface";
import { generateStructuredObject } from "../ai-provider/generate-structured-object";
import { AppError, ErrorCode, sanitizeErrorMessage, ErrorCodeConfig } from "../common/errors";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

@Injectable()
export class ContractExtractionService {
  private readonly logger = new Logger(ContractExtractionService.name);

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

    let lastError: Error | unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        return await generateStructuredObject({
          aiProviderFactory: this.aiProviderFactory,
          providerConfiguration,
          schema: ExtractedContractDataSchema,
          system: systemPrompt,
          prompt: userPrompt,
        });
      } catch (error) {
        lastError = error;
        const retryableCode = sanitizeErrorMessage(error instanceof Error ? error : new Error(String(error)));
        const errorConfig = ErrorCodeConfig[retryableCode];

        this.logger.error(
          `AI extraction attempt ${attempt + 1}/${MAX_RETRIES} failed: ${retryableCode}`,
          error instanceof Error ? error.stack : undefined,
        );

        if (!errorConfig.retryable || attempt === MAX_RETRIES - 1) {
          throw new AppError(retryableCode, { context: { attempts: attempt + 1 } });
        }

        await this.delay(RETRY_DELAYS[attempt]);
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
