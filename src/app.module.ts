import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiConfigModule } from "./ai-config/ai-config.module";
import { AiProviderModule } from "./ai-provider/ai-provider.module";
import { DocumentParsingModule } from "./document-parsing/document-parsing.module";
import { ContractExtractionModule } from "./contract-extraction/contract-extraction.module";
import { ContractRiskAnalysisModule } from "./contract-risk-analysis/contract-risk-analysis.module";
import { ContractSummaryModule } from "./contract-summary/contract-summary.module";
import { ContractUploadModule } from "./contract-upload/contract-upload.module";
import { ContractComparisonModule } from "./contract-comparison/contract-comparison.module";
import { HealthModule } from "./health/health.module";
import { LoggerModule } from "./common/logger/logger.module";
import { CommonModule } from "./common/common.module";
import { HttpLoggingMiddleware } from "./common/middleware/http-logging.middleware";
import { RateLimitingMiddleware } from "./common/middleware/rate-limiting.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    CommonModule,
    AiConfigModule,
    AiProviderModule,
    DocumentParsingModule,
    ContractExtractionModule,
    ContractRiskAnalysisModule,
    ContractSummaryModule,
    ContractUploadModule,
    ContractComparisonModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggingMiddleware).forRoutes("*");
    // TODO: Re-enable rate limiting once the underlying issue is resolved
    consumer.apply(RateLimitingMiddleware).forRoutes("*");
  }
}
