import { Module } from "@nestjs/common";
import { RateLimitingService } from "./rate-limiting/rate-limiting.service";
import { AiBudgetService } from "./ai-budget/ai-budget.service";
import { HttpLoggingMiddleware } from "./middleware/http-logging.middleware";
import { RateLimitingMiddleware } from "./middleware/rate-limiting.middleware";

@Module({
  providers: [RateLimitingService, AiBudgetService, HttpLoggingMiddleware, RateLimitingMiddleware],
  exports: [RateLimitingService, AiBudgetService],
})
export class CommonModule {}
