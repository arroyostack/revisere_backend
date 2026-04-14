import { Module } from '@nestjs/common';
import { ContractRiskAnalysisService } from './contract-risk-analysis.service';

@Module({
  providers: [ContractRiskAnalysisService],
  exports: [ContractRiskAnalysisService],
})
export class ContractRiskAnalysisModule {}
