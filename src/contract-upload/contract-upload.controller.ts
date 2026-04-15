import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Request } from "express";
import { ContractExtractionService } from "../contract-extraction/contract-extraction.service";
import { ContractRiskAnalysisService } from "../contract-risk-analysis/contract-risk-analysis.service";
import { ContractSummaryService } from "../contract-summary/contract-summary.service";
import { DocumentParsingService } from "../document-parsing/document-parsing.service";
import { ContractFileValidationPipe } from "./pipes/contract-file-validation.pipe";
import { ContractFullAnalysisResponse } from "./interfaces/contract-full-analysis-response.interface";
import { AiConfigService } from "../ai-config/ai-config.service";
import { AiBudgetService } from "../common/ai-budget/ai-budget.service";
import { CONTRACT_FILE_UPLOAD } from "../common/constants/contract-file-upload.constant";

@ApiTags("Contract Analysis")
@Controller()
export class ContractUploadController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
    private readonly contractExtractionService: ContractExtractionService,
    private readonly contractRiskAnalysisService: ContractRiskAnalysisService,
    private readonly contractSummaryService: ContractSummaryService,
    private readonly aiConfigService: AiConfigService,
    private readonly aiBudgetService: AiBudgetService,
  ) {}

  @ApiOperation({
    summary: "Analyze a contract document",
    description:
      "Upload a contract document (PDF or DOCX) to receive structured extraction, risk analysis, and plain-English summary. The AI extracts parties, obligations, payment terms, termination conditions, and identifies key clauses.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Returns structured contract analysis including extracted data, risk assessment, and summary.",
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid file type or file validation failed. Only PDF and DOCX files are accepted.",
  })
  @ApiResponse({
    status: 413,
    description:
      "File size exceeds maximum allowed limit. Maximum file size is 10MB.",
  })
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
    @Req() request: Request,
  ): Promise<ContractFullAnalysisResponse> {
    const clientIp = request.ip || request.connection.remoteAddress || "unknown";
    
    // Check and enforce AI budget limits
    this.aiBudgetService.throwIfBudgetExceeded(clientIp);
    
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

    // Record AI calls (3 calls: extraction, risk, summary)
    this.aiBudgetService.recordContractAnalysis(clientIp);

    return {
      originalFileName: parsedContractDocument.originalFileName,
      extractedData: extractedContractData,
      riskAnalysis: contractRiskAnalysis,
      summary: contractSummary,
    };
  }
}
