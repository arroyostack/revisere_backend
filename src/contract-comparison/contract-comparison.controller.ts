import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ContractComparisonService } from "./contract-comparison.service";
import { DocumentParsingService } from "../document-parsing/document-parsing.service";
import { ContractFileValidationPipe } from "../contract-upload/pipes/contract-file-validation.pipe";
import { ContractComparisonResult } from "./schemas/contract-comparison-result.schema";
import { AiConfigService } from "../ai-config/ai-config.service";
import { CONTRACT_FILE_UPLOAD } from "../common/constants/contract-file-upload.constant";

@ApiTags("Contract Comparison")
@Controller("contract-comparison")
export class ContractComparisonController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
    private readonly contractComparisonService: ContractComparisonService,
    private readonly aiConfigService: AiConfigService,
  ) {}

  @ApiOperation({
    summary: "Compare two contract documents",
    description:
      "Upload two contract documents (PDF or DOCX) to identify and analyze the differences between them. Returns a structured comparison showing added/removed clauses, change direction (favoring which party), and overall assessment of which version is more favorable.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Returns structured contract comparison with identified changes, favorability assessment, and recommendations.",
  })
  @ApiResponse({
    status: 400,
    description:
      "Missing required files or invalid file type. Both first and second contract files are required, and only PDF and DOCX files are accepted.",
  })
  @ApiResponse({
    status: 413,
    description:
      "File size exceeds maximum allowed limit. Maximum file size is 10MB per file.",
  })
  @Post("compare")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "firstContractFile", maxCount: 1 },
        { name: "secondContractFile", maxCount: 1 },
      ],
      {
        limits: {
          fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
        },
      },
    ),
  )
  async compareContracts(
    @UploadedFiles()
    uploadedContractFiles:
      | {
          firstContractFile?: Express.Multer.File[];
          secondContractFile?: Express.Multer.File[];
        }
      | undefined,
  ): Promise<ContractComparisonResult> {
    const firstContractFile = uploadedContractFiles?.firstContractFile?.[0];
    const secondContractFile = uploadedContractFiles?.secondContractFile?.[0];

    // Validate files are present
    if (!firstContractFile) {
      throw new BadRequestException("First contract file is required");
    }

    if (!secondContractFile) {
      throw new BadRequestException("Second contract file is required");
    }

    // Validate files with the pipe
    const contractFileValidationPipe = new ContractFileValidationPipe();

    const validatedFirstContractFile =
      contractFileValidationPipe.transform(firstContractFile);
    const validatedSecondContractFile =
      contractFileValidationPipe.transform(secondContractFile);

    const aiProviderConfiguration =
      this.aiConfigService.getProviderConfiguration();

    const [firstParsedContractDocument, secondParsedContractDocument] =
      await Promise.all([
        this.documentParsingService.parseDocument(
          validatedFirstContractFile.buffer,
          validatedFirstContractFile.originalname,
          validatedFirstContractFile.mimetype,
        ),
        this.documentParsingService.parseDocument(
          validatedSecondContractFile.buffer,
          validatedSecondContractFile.originalname,
          validatedSecondContractFile.mimetype,
        ),
      ]);

    const generatedComparisonResult =
      await this.contractComparisonService.compareContracts(
        firstParsedContractDocument.plainText,
        secondParsedContractDocument.plainText,
        aiProviderConfiguration,
      );

    return {
      ...generatedComparisonResult,
      firstContractTitle: firstParsedContractDocument.originalFileName,
      secondContractTitle: secondParsedContractDocument.originalFileName,
    };
  }
}
