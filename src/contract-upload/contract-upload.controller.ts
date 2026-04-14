import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ContractExtractionService } from "../contract-extraction/contract-extraction.service";
import { ContractRiskAnalysisService } from "../contract-risk-analysis/contract-risk-analysis.service";
import { ContractSummaryService } from "../contract-summary/contract-summary.service";
import { DocumentParsingService } from "../document-parsing/document-parsing.service";
import { ContractFileValidationPipe } from "./pipes/contract-file-validation.pipe";
import { ContractFullAnalysisResponse } from "./interfaces/contract-full-analysis-response.interface";
import { AiConfigService } from "../ai-config/ai-config.service";
import { CONTRACT_FILE_UPLOAD } from "../common/constants/contract-file-upload.constant";

@Controller()
export class ContractUploadController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
    private readonly contractExtractionService: ContractExtractionService,
    private readonly contractRiskAnalysisService: ContractRiskAnalysisService,
    private readonly contractSummaryService: ContractSummaryService,
    private readonly aiConfigService: AiConfigService,
  ) {}

  @Post("contract-analysis/analyze")
  @UseInterceptors(
    FileInterceptor("contractFile", {
      storage: memoryStorage(),
      limits: {
        fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  async analyzeContract(
    @UploadedFile(new ContractFileValidationPipe())
    uploadedContractFile: Express.Multer.File,
  ): Promise<ContractFullAnalysisResponse> {
    const aiProviderConfiguration =
      this.aiConfigService.getProviderConfiguration();

    const parsedContractDocument =
      await this.documentParsingService.parseDocument(
        uploadedContractFile.buffer,
        uploadedContractFile.originalname,
        uploadedContractFile.mimetype,
      );

    const [extractedContractData, contractRiskAnalysis, contractSummary] =
      await Promise.all([
        this.contractExtractionService.extractContractData(
          parsedContractDocument.plainText,
          aiProviderConfiguration,
        ),
        this.contractRiskAnalysisService.analyzeContractRisks(
          parsedContractDocument.plainText,
          aiProviderConfiguration,
        ),
        this.contractSummaryService.summarizeContract(
          parsedContractDocument.plainText,
          aiProviderConfiguration,
        ),
      ]);

    return {
      originalFileName: parsedContractDocument.originalFileName,
      extractedData: extractedContractData,
      riskAnalysis: contractRiskAnalysis,
      summary: contractSummary,
    };
  }
}
