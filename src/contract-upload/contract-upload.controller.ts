import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractExtractionService } from '../contract-extraction/contract-extraction.service';
import { ContractRiskAnalysisService } from '../contract-risk-analysis/contract-risk-analysis.service';
import { ContractSummaryService } from '../contract-summary/contract-summary.service';
import { DocumentParsingService } from '../document-parsing/document-parsing.service';
import { ContractFileValidationPipe } from './pipes/contract-file-validation.pipe';
import { ContractFullAnalysisResponse } from './interfaces/contract-full-analysis-response.interface';
import { AiProviderRequestDtoSchema } from '../common/dto/ai-provider-request.dto';
import { AiProviderConfiguration } from '../ai-provider/interfaces/ai-provider-configuration.interface';
import { CONTRACT_FILE_UPLOAD } from '../common/constants/contract-file-upload.constant';

@Controller()
export class ContractUploadController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
    private readonly contractExtractionService: ContractExtractionService,
    private readonly contractRiskAnalysisService: ContractRiskAnalysisService,
    private readonly contractSummaryService: ContractSummaryService,
  ) {}

  @Post('contract-analysis/analyze')
  @UseInterceptors(
    FileInterceptor('contractFile', {
      storage: undefined,
      limits: {
        fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  async analyzeContract(
    @UploadedFile(new ContractFileValidationPipe())
    contractFile: Express.Multer.File,
    @Body('providerConfiguration') providerConfigurationJson: string,
  ): Promise<ContractFullAnalysisResponse> {
    let providerConfiguration: AiProviderConfiguration;

    try {
      const parsed = JSON.parse(providerConfigurationJson);
      providerConfiguration = AiProviderRequestDtoSchema.parse(parsed);
    } catch {
      throw new BadRequestException(
        'Invalid providerConfiguration. Must be valid JSON matching the required schema.',
      );
    }

    const parsedDocument = await this.documentParsingService.parseDocument(
      contractFile.buffer,
      contractFile.originalname,
      contractFile.mimetype,
    );

    const [extractedData, riskAnalysis, summary] = await Promise.all([
      this.contractExtractionService.extractContractData(
        parsedDocument.plainText,
        providerConfiguration,
      ),
      this.contractRiskAnalysisService.analyzeContractRisks(
        parsedDocument.plainText,
        providerConfiguration,
      ),
      this.contractSummaryService.summarizeContract(
        parsedDocument.plainText,
        providerConfiguration,
      ),
    ]);

    return {
      originalFileName: parsedDocument.originalFileName,
      extractedData,
      riskAnalysis,
      summary,
    };
  }
}
