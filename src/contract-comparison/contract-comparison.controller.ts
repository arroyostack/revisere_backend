import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ContractComparisonService } from "./contract-comparison.service";
import { DocumentParsingService } from "../document-parsing/document-parsing.service";
import { ContractFileValidationPipe } from "../contract-upload/pipes/contract-file-validation.pipe";
import { ContractComparisonResult } from "./schemas/contract-comparison-result.schema";
import { AiConfigService } from "../ai-config/ai-config.service";
import { CONTRACT_FILE_UPLOAD } from "../common/constants/contract-file-upload.constant";

@Controller("contract-comparison")
export class ContractComparisonController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
    private readonly contractComparisonService: ContractComparisonService,
    private readonly aiConfigService: AiConfigService,
  ) {}

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
    @UploadedFile("firstContractFile")
    firstContractFile: Express.Multer.File | undefined,
    @UploadedFile("secondContractFile")
    secondContractFile: Express.Multer.File | undefined,
  ): Promise<ContractComparisonResult> {
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
