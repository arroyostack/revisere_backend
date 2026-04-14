import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RateLimitingService } from "../rate-limiting/rate-limiting.service";

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  constructor(private readonly rateLimitingService: RateLimitingService) {}

  use(request: Request, response: Response, nextFunction: NextFunction): void {
    this.rateLimitingService.enforceRateLimit(request, response, nextFunction);
  }
}