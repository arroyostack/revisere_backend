import { Module } from '@nestjs/common';
import { ContractComparisonController } from './contract-comparison.controller';
import { ContractComparisonService } from './contract-comparison.service';
import { DocumentParsingModule } from '../document-parsing/document-parsing.module';

@Module({
  imports: [DocumentParsingModule],
  controllers: [ContractComparisonController],
  providers: [ContractComparisonService],
  exports: [ContractComparisonService],
})
export class ContractComparisonModule {}
