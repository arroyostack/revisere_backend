import { Module, Global } from '@nestjs/common';
import { AiProviderFactoryService } from './ai-provider-factory.service';

@Global()
@Module({
  providers: [AiProviderFactoryService],
  exports: [AiProviderFactoryService],
})
export class AiProviderModule {}
