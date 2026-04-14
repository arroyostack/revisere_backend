import { Module } from "@nestjs/common";
import { RateLimitingService } from "./rate-limiting/rate-limiting.service";
import { HttpLoggingMiddleware } from "./middleware/http-logging.middleware";
import { RateLimitingMiddleware } from "./middleware/rate-limiting.middleware";

@Module({
  providers: [RateLimitingService, HttpLoggingMiddleware, RateLimitingMiddleware],
  exports: [RateLimitingService],
})
export class CommonModule {}