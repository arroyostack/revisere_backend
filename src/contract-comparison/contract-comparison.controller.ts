import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ContractComparisonService } from './contract-comparison.service';
import { DocumentParsingService } from '../document-parsing/document-parsing.service';
import { ContractFileValidationPipe } from '../contract-upload/pipes/contract-file-validation.pipe';
import { ContractComparisonResult } from './schemas/contract-comparison-result.schema';
import { AiProviderRequestDtoSchema } from '../common/dto/ai-provider-request.dto';
import { AiProviderConfiguration } from '../ai-provider/interfaces/ai-provider-configuration.interface';
import { CONTRACT_FILE_UPLOAD } from '../common/constants/contract-file-upload.constant';

@Controller('contract-comparison')
export class ContractComparisonController {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
    private readonly contractComparisonService: ContractComparisonService,
  ) {}

  @Post('compare')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'firstContractFile', maxCount: 1 },
        { name: 'secondContractFile', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
        },
      },
    ),
  )
  async compareContracts(
    @UploadedFile('firstContractFile') firstContractFile: Express.Multer.File | undefined,
    @UploadedFile('secondContractFile') secondContractFile: Express.Multer.File | undefined,
    @Body('providerConfiguration') providerConfigurationJson: string,
  ): Promise<ContractComparisonResult> {
    // Validate files are present
    if (!firstContractFile) {
      throw new BadRequestException('First contract file is required');
    }
    if (!secondContractFile) {
      throw new BadRequestException('Second contract file is required');
    }

    // Validate files with the pipe
    const firstValidationPipe = new ContractFileValidationPipe();
    const secondValidationPipe = new ContractFileValidationPipe();

    const validatedFirstFile = firstValidationPipe.transform(firstContractFile);
    const validatedSecondFile = secondValidationPipe.transform(secondContractFile);

    let providerConfiguration: AiProviderConfiguration;

    try {
      const parsed = JSON.parse(providerConfigurationJson);
      providerConfiguration = AiProviderRequestDtoSchema.parse(parsed);
    } catch {
      throw new BadRequestException(
        'Invalid providerConfiguration. Must be valid JSON matching the required schema.',
      );
    }

    const [firstParsedDocument, secondParsedDocument] = await Promise.all([
      this.documentParsingService.parseDocument(
        validatedFirstFile.buffer,
        validatedFirstFile.originalname,
        validatedFirstFile.mimetype,
      ),
      this.documentParsingService.parseDocument(
        validatedSecondFile.buffer,
        validatedSecondFile.originalname,
        validatedSecondFile.mimetype,
      ),
    ]);

    const comparisonResult = await this.contractComparisonService.compareContracts(
      firstParsedDocument.plainText,
      secondParsedDocument.plainText,
      providerConfiguration,
    );

    return {
      ...comparisonResult,
      firstContractTitle: firstParsedDocument.originalFileName,
      secondContractTitle: secondParsedDocument.originalFileName,
    };
  }
}
