import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
    FilesInterceptor(
      ['firstContractFile', 'secondContractFile'],
      2,
      {
        storage: undefined,
        limits: {
          fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
        },
      },
    ),
  )
  async compareContracts(
    @UploadedFiles('firstContractFile', new ContractFileValidationPipe())
    firstContractFile: Express.Multer.File,
    @UploadedFiles('secondContractFile', new ContractFileValidationPipe())
    secondContractFile: Express.Multer.File,
    @Body('providerConfiguration') providerConfigurationJson: string,
  ): Promise<ContractComparisonResult> {
    let providerConfiguration: AiProviderConfiguration;

    try {
      const parsed = JSON.parse(providerConfigurationJson);
      providerConfiguration = AiProviderRequestDtoSchema.parse(parsed);
    } catch {
      throw new BadRequestException(
        'Invalid providerConfiguration. Must be valid JSON matching the required schema.',
      );
    }

    const firstContract = firstContractFile[0] || firstContractFile;
    const secondContract = secondContractFile[0] || secondContractFile;

    const [firstParsedDocument, secondParsedDocument] = await Promise.all([
      this.documentParsingService.parseDocument(
        firstContract.buffer,
        firstContract.originalname,
        firstContract.mimetype,
      ),
      this.documentParsingService.parseDocument(
        secondContract.buffer,
        secondContract.originalname,
        secondContract.mimetype,
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
