import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ContractComparisonController } from './contract-comparison.controller';
import { ContractComparisonService } from './contract-comparison.service';
import { DocumentParsingModule } from '../document-parsing/document-parsing.module';
import { CONTRACT_FILE_UPLOAD } from '../common/constants/contract-file-upload.constant';

@Module({
  imports: [
    DocumentParsingModule,
    MulterModule.register({
      limits: {
        fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
      },
    }),
  ],
  controllers: [ContractComparisonController],
  providers: [ContractComparisonService],
  exports: [ContractComparisonService],
})
export class ContractComparisonModule {}
