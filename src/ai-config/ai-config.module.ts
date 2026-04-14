import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiConfigService } from './ai-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AiConfigService],
  exports: [AiConfigService],
})
export class AiConfigModule {}