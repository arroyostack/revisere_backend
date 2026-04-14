import { Module } from '@nestjs/common';
import { DocumentParsingService } from './document-parsing.service';

@Module({
  providers: [DocumentParsingService],
  exports: [DocumentParsingService],
})
export class DocumentParsingModule {}
