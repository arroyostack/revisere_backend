import { Injectable } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { WinstonLoggerService } from "../logger/winston-logger.service";

interface RateLimitEntry {
  requestCount: number;
  resetTimeMs: number;
}

interface RateLimiterConfiguration {
  maximumRequestsPerWindow: number;
  windowDurationInSeconds: number;
}

@Injectable()
export class RateLimitingService {
  private readonly requestCountsByIp: Map<string, RateLimitEntry> = new Map();
  private readonly defaultRateLimiterConfiguration: RateLimiterConfiguration = {
    maximumRequestsPerWindow: 20,
    windowDurationInSeconds: 60,
  };

  constructor(private readonly winstonLoggerService: WinstonLoggerService) {}

  getRateLimiterConfiguration(): RateLimiterConfiguration {
    const configuredMaximumRequests = process.env.RATE_LIMIT_MAX_REQUESTS;
    const configuredWindowDuration = process.env.RATE_LIMIT_WINDOW_SECONDS;

    return {
      maximumRequestsPerWindow: configuredMaximumRequests
        ? parseInt(configuredMaximumRequests, 10)
        : this.defaultRateLimiterConfiguration.maximumRequestsPerWindow,
      windowDurationInSeconds: configuredWindowDuration
        ? parseInt(configuredWindowDuration, 10)
        : this.defaultRateLimiterConfiguration.windowDurationInSeconds,
    };
  }

  isRateLimitExceeded(clientIpAddress: string): boolean {
    const currentTimeMs = Date.now();
    const entry = this.requestCountsByIp.get(clientIpAddress);

    if (!entry || entry.resetTimeMs < currentTimeMs) {
      const configuration = this.getRateLimiterConfiguration();
      const newResetTimeMs = currentTimeMs + configuration.windowDurationInSeconds * 1000;

      this.requestCountsByIp.set(clientIpAddress, {
        requestCount: 1,
        resetTimeMs: newResetTimeMs,
      });

      return false;
    }

    const configuration = this.getRateLimiterConfiguration();
    if (entry.requestCount >= configuration.maximumRequestsPerWindow) {
      return true;
    }

    entry.requestCount += 1;
    return false;
  }

  getRemainingRequests(clientIpAddress: string): number {
    const currentTimeMs = Date.now();
    const entry = this.requestCountsByIp.get(clientIpAddress);
    const configuration = this.getRateLimiterConfiguration();

    if (!entry || entry.resetTimeMs < currentTimeMs) {
      return configuration.maximumRequestsPerWindow;
    }

    return Math.max(
      0,
      configuration.maximumRequestsPerWindow - entry.requestCount
    );
  }

  getRetryAfterSeconds(clientIpAddress: string): number {
    const entry = this.requestCountsByIp.get(clientIpAddress);
    if (!entry) {
      return 0;
    }

    const currentTimeMs = Date.now();
    const remainingTimeMs = Math.max(0, entry.resetTimeMs - currentTimeMs);
    return Math.ceil(remainingTimeMs / 1000);
  }

  handleRateLimitExceeded(response: Response, clientIpAddress: string): void {
    const retryAfterSeconds = this.getRetryAfterSeconds(clientIpAddress);

    this.winstonLoggerService.warn(
      `Rate limit exceeded for IP: ${clientIpAddress}`,
      "RateLimiting"
    );

    response.setHeader("X-RateLimit-Remaining", "0");
    response.setHeader("X-RateLimit-Reset", String(retryAfterSeconds));
    response.setHeader("Retry-After", String(retryAfterSeconds));

    response.status(429).json({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfterSeconds: retryAfterSeconds,
    });
  }

  enforceRateLimit(request: Request, response: Response, nextFunction: NextFunction): void {
    const clientIpAddress = request.ip || request.connection.remoteAddress || "unknown";

    if (this.isRateLimitExceeded(clientIpAddress)) {
      this.handleRateLimitExceeded(response, clientIpAddress);
      return;
    }

    const remainingRequests = this.getRemainingRequests(clientIpAddress);
    response.setHeader("X-RateLimit-Remaining", String(remainingRequests));

    nextFunction();
  }

  cleanupExpiredEntries(): void {
    const currentTimeMs = Date.now();
    const ipAddressesToDelete: string[] = [];

    for (const [ipAddress, entry] of this.requestCountsByIp.entries()) {
      if (entry.resetTimeMs < currentTimeMs) {
        ipAddressesToDelete.push(ipAddress);
      }
    }

    for (const ipAddress of ipAddressesToDelete) {
      this.requestCountsByIp.delete(ipAddress);
    }
  }
}