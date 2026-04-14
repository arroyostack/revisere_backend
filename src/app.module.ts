import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiProviderModule } from './ai-provider/ai-provider.module';
import { DocumentParsingModule } from './document-parsing/document-parsing.module';
import { ContractExtractionModule } from './contract-extraction/contract-extraction.module';
import { ContractRiskAnalysisModule } from './contract-risk-analysis/contract-risk-analysis.module';
import { ContractSummaryModule } from './contract-summary/contract-summary.module';
import { ContractUploadModule } from './contract-upload/contract-upload.module';
import { ContractComparisonModule } from './contract-comparison/contract-comparison.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AiProviderModule,
    DocumentParsingModule,
    ContractExtractionModule,
    ContractRiskAnalysisModule,
    ContractSummaryModule,
    ContractUploadModule,
    ContractComparisonModule,
  ],
})
export class AppModule {}
