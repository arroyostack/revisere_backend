import { Test, TestingModule } from '@nestjs/testing';
import { ContractExtractionService } from '../../../../src/contract-extraction/contract-extraction.service';
import { AiProviderFactoryService } from '../../../../src/ai-provider/ai-provider-factory.service';
import { AiProviderConfiguration } from '../../../../src/ai-provider/interfaces/ai-provider-configuration.interface';
import { generateStructuredObject } from '../../../../src/ai-provider/generate-structured-object';
import { ExtractedContractData } from '../../../../src/contract-extraction/schemas/extracted-contract-data.schema';
import { AppError, ErrorCode } from '../../../../src/common/errors';
import { createMock } from '../../../utils/mock';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../../../src/ai-provider/generate-structured-object', () => ({
  generateStructuredObject: vi.fn(),
}));

describe('ContractExtractionService', () => {
  let service: ContractExtractionService;
  let mockAiProviderFactory: ReturnType<typeof createMock<AiProviderFactoryService>>;

  const mockContractPlainText = 'This is a sample contract with terms and conditions.';
  const mockAiProviderConfiguration: AiProviderConfiguration = {
    providerName: 'openai',
    apiKey: 'test-api-key',
  };

  const mockExtractedData: ExtractedContractData = {
    contractTitle: 'Sample Contract',
    parties: [{ name: 'Company A', role: 'Party A' }],
    effectiveDate: new Date('2024-01-01'),
    terminationDate: new Date('2025-01-01'),
    obligations: [{ description: 'Payment obligation', party: 'Company A' }],
    keyDates: [{ description: 'Start date', date: new Date('2024-01-01') }],
    importantClauses: [{ type: 'confidentiality', description: 'Confidentiality clause' }],
  };

  beforeEach(async () => {
    mockAiProviderFactory = createMock<AiProviderFactoryService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractExtractionService,
        { provide: AiProviderFactoryService, useValue: mockAiProviderFactory },
      ],
    }).compile();

    service = module.get<ContractExtractionService>(ContractExtractionService);
  });

  describe('extractContractData', () => {
    it('should return parsed response matching schema when AI returns valid data', async () => {
      vi.mocked(generateStructuredObject).mockResolvedValue(mockExtractedData);

      const result = await service.extractContractData(
        mockContractPlainText,
        mockAiProviderConfiguration,
      );

      expect(result).toEqual(mockExtractedData);
      expect(generateStructuredObject).toHaveBeenCalled();
      
      const calledArgs = vi.mocked(generateStructuredObject).mock.calls[0][0];
      expect(calledArgs.providerConfiguration).toEqual(mockAiProviderConfiguration);
      expect(calledArgs.schema).toBeDefined();
      expect(calledArgs.system).toContain('legal document analysis expert');
      expect(calledArgs.prompt).toContain('<contract_text>');
    });

    it('should pass correct system prompt about extraction rules', async () => {
      vi.mocked(generateStructuredObject).mockResolvedValue(mockExtractedData);

      await service.extractContractData(mockContractPlainText, mockAiProviderConfiguration);

      const calledArgs = vi.mocked(generateStructuredObject).mock.calls[0][0];
      expect(calledArgs.system).toContain('Only extract information that is EXPLICITLY present');
      expect(calledArgs.system).toContain('Do NOT infer, assume, or hallucinate');
      expect(calledArgs.system).toContain('Extract ALL parties');
    });

    it('should pass correct user prompt with wrapped contract text', async () => {
      vi.mocked(generateStructuredObject).mockResolvedValue(mockExtractedData);

      await service.extractContractData(mockContractPlainText, mockAiProviderConfiguration);

      const calledArgs = vi.mocked(generateStructuredObject).mock.calls[0][0];
      expect(calledArgs.prompt).toContain('<contract_text>');
      expect(calledArgs.prompt).toContain(mockContractPlainText);
      expect(calledArgs.prompt).toContain('</contract_text>');
    });

    it('should throw AppError with EXTRACT_TIMEOUT code on timeout error', async () => {
      const timeoutError = new Error('AI provider timeout');
      vi.mocked(generateStructuredObject).mockRejectedValue(timeoutError);

      await expect(
        service.extractContractData(mockContractPlainText, mockAiProviderConfiguration),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError with error code from error message', async () => {
      vi.mocked(generateStructuredObject).mockRejectedValue(new Error('timeout'));

      try {
        await service.extractContractData(mockContractPlainText, mockAiProviderConfiguration);
      } catch (error) {
        const response = error.getResponse();
        expect(response.code).toBe(ErrorCode.EXTRACT_TIMEOUT);
      }
    });

    it('should throw EXTRACT_INVALID_RESPONSE on schema validation error', async () => {
      vi.mocked(generateStructuredObject).mockRejectedValue(new Error('schema validation failed'));

      try {
        await service.extractContractData(mockContractPlainText, mockAiProviderConfiguration);
      } catch (error) {
        const response = error.getResponse();
        expect(response.code).toBe(ErrorCode.EXTRACT_INVALID_RESPONSE);
      }
    });

    it('should throw EXTRACT_UNKNOWN on unknown error without retryable flag', async () => {
      vi.mocked(generateStructuredObject).mockRejectedValue('Unknown error');

      try {
        await service.extractContractData(mockContractPlainText, mockAiProviderConfiguration);
      } catch (error) {
        const response = error.getResponse();
        expect(response.code).toBe(ErrorCode.EXTRACT_UNKNOWN);
      }
    });

    it('should throw AppError when AI returns malformed response', async () => {
      const malformedResponse = { invalid: 'data' };
      vi.mocked(generateStructuredObject).mockResolvedValue(malformedResponse as any);

      const result = await service.extractContractData(mockContractPlainText, mockAiProviderConfiguration);

      expect(result).toEqual(malformedResponse);
    });
  });
});