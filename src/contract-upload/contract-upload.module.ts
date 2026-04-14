import { Module } from '@nestjs/common';
import { ContractUploadController } from './contract-upload.controller';
import { DocumentParsingModule } from '../document-parsing/document-parsing.module';
import { ContractExtractionModule } from '../contract-extraction/contract-extraction.module';
import { ContractRiskAnalysisModule } from '../contract-risk-analysis/contract-risk-analysis.module';
import { ContractSummaryModule } from '../contract-summary/contract-summary.module';

@Module({
  imports: [
    DocumentParsingModule,
    ContractExtractionModule,
    ContractRiskAnalysisModule,
    ContractSummaryModule,
  ],
  controllers: [ContractUploadController],
})
export class ContractUploadModule {}
