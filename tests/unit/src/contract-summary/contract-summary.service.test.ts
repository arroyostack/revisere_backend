import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { ContractSummaryService } from '../../../../src/contract-summary/contract-summary.service';
import { AiProviderFactoryService } from '../../../../src/ai-provider/ai-provider-factory.service';
import { AiProviderConfiguration } from '../../../../src/ai-provider/interfaces/ai-provider-configuration.interface';
import { generateStructuredObject } from '../../../../src/ai-provider/generate-structured-object';
import { ContractSummaryResult } from '../../../../src/contract-summary/schemas/contract-summary-result.schema';
import { createMock } from '../../../utils/mock';

vi.mock('../../../../src/ai-provider/generate-structured-object', () => ({
  generateStructuredObject: vi.fn(),
}));

describe('ContractSummaryService', () => {
  let service: ContractSummaryService;
  let mockAiProviderFactory: ReturnType<typeof createMock<AiProviderFactoryService>>;

  const mockContractPlainText = 'This is a sample contract with terms and conditions.';
  const mockAiProviderConfiguration: AiProviderConfiguration = {
    providerName: 'openai',
    apiKey: 'test-api-key',
  };

  const mockSummaryResult: ContractSummaryResult = {
    summary: 'This contract outlines the terms between Company A and Company B.',
    keyPoints: [
      'Contract duration is 12 months',
      'Payment terms are net 30',
      'Termination requires 30 days notice',
    ],
    plainLanguageExplanation: 'In simple terms, this is a standard business contract.',
  };

  beforeEach(async () => {
    mockAiProviderFactory = createMock<AiProviderFactoryService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractSummaryService,
        { provide: AiProviderFactoryService, useValue: mockAiProviderFactory },
      ],
    }).compile();

    service = module.get<ContractSummaryService>(ContractSummaryService);
  });

  describe('summarizeContract', () => {
    it('should return parsed response matching schema when AI returns valid data', async () => {
      vi.mocked(generateStructuredObject).mockResolvedValue(mockSummaryResult);

      const result = await service.summarizeContract(
        mockContractPlainText,
        mockAiProviderConfiguration,
      );

      expect(result).toEqual(mockSummaryResult);
      expect(generateStructuredObject).toHaveBeenCalled();
      
      const calledArgs = vi.mocked(generateStructuredObject).mock.calls[0][0];
      expect(calledArgs.providerConfiguration).toEqual(mockAiProviderConfiguration);
      expect(calledArgs.schema).toBeDefined();
      expect(calledArgs.system).toContain('legal document simplification expert');
      expect(calledArgs.prompt).toContain('<contract_text>');
    });

    it('should pass correct system prompt about plain language rules', async () => {
      vi.mocked(generateStructuredObject).mockResolvedValue(mockSummaryResult);

      await service.summarizeContract(mockContractPlainText, mockAiProviderConfiguration);

      const calledArgs = vi.mocked(generateStructuredObject).mock.calls[0][0];
      expect(calledArgs.system).toContain('Write in plain language that a non-lawyer can understand');
      expect(calledArgs.system).toContain('Only use information that is EXPLICITLY present');
      expect(calledArgs.system).toContain('Focus on practical, actionable information');
    });

    it('should pass correct user prompt with wrapped contract text', async () => {
      vi.mocked(generateStructuredObject).mockResolvedValue(mockSummaryResult);

      await service.summarizeContract(mockContractPlainText, mockAiProviderConfiguration);

      const calledArgs = vi.mocked(generateStructuredObject).mock.calls[0][0];
      expect(calledArgs.prompt).toContain('<contract_text>');
      expect(calledArgs.prompt).toContain(mockContractPlainText);
      expect(calledArgs.prompt).toContain('</contract_text>');
    });

    it('should throw UnprocessableEntityException with message when AI throws error with message', async () => {
      const aiError = new Error('AI provider rate limit exceeded');
      vi.mocked(generateStructuredObject).mockRejectedValue(aiError);

      await expect(
        service.summarizeContract(mockContractPlainText, mockAiProviderConfiguration),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException with generic message when error has no message', async () => {
      vi.mocked(generateStructuredObject).mockRejectedValue(12345);

      await expect(
        service.summarizeContract(mockContractPlainText, mockAiProviderConfiguration),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should return result even when AI returns minimal data', async () => {
      const minimalResult: ContractSummaryResult = {
        summary: 'Short summary',
        keyPoints: [],
        plainLanguageExplanation: '',
      };
      vi.mocked(generateStructuredObject).mockResolvedValue(minimalResult);

      const result = await service.summarizeContract(mockContractPlainText, mockAiProviderConfiguration);

      expect(result).toEqual(minimalResult);
    });
  });
});