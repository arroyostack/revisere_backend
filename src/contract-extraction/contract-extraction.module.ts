import { Module } from '@nestjs/common';
import { ContractExtractionService } from './contract-extraction.service';

@Module({
  providers: [ContractExtractionService],
  exports: [ContractExtractionService],
})
export class ContractExtractionModule {}
