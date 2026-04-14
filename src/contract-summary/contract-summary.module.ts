import { Module } from '@nestjs/common';
import { ContractSummaryService } from './contract-summary.service';

@Module({
  providers: [ContractSummaryService],
  exports: [ContractSummaryService],
})
export class ContractSummaryModule {}
