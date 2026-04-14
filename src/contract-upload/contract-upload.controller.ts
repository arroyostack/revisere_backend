import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { ContractExtractionService } from '../contract-extraction/contract-extraction.service';
import { ContractRiskAnalysisService } from '../contract-risk-analysis/contract-risk-analysis.service';
import { ContractSummaryService } from '../contract-summary/contract-summary.service';
import { DocumentParsingService } from '../document-parsing/document-parsing.service';
import { ContractFileValidationPipe } from './pipes/contract-file-validation.pipe';
import { ContractFullAnalysisResponse } from './interfaces/contract-full-analysis-response.interface';
import { AiConfigService } from '../ai-config/ai-config.service';
import { CONTRACT_FILE_UPLOAD } from '../common/constants/contract-file-upload.constant';

@Controller()
export class ContractUploadController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
    private readonly contractExtractionService: ContractExtractionService,
    private readonly contractRiskAnalysisService: ContractRiskAnalysisService,
    private readonly contractSummaryService: ContractSummaryService,
    private readonly aiConfigService: AiConfigService,
  ) {}

  @Post('contract-analysis/analyze')
  @UseInterceptors(
    FileInterceptor('contractFile', {
      storage: memoryStorage(),
      limits: {
        fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  async analyzeContract(
    @UploadedFile(new ContractFileValidationPipe())
    contractFile: Express.Multer.File,
  ): Promise<ContractFullAnalysisResponse> {
    console.log('=== CONTRACT UPLOAD CONTROLLER ===');
    console.log('contractFile:', {
      fieldname: contractFile.fieldname,
      originalname: contractFile.originalname,
      encoding: contractFile.encoding,
      mimetype: contractFile.mimetype,
      size: contractFile.size,
    });
    console.log('===================================');
    
    const providerConfiguration = this.aiConfigService.getProviderConfiguration();

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