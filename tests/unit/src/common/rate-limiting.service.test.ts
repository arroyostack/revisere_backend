import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimitingService } from "@/common/rate-limiting/rate-limiting.service";
import { WinstonLoggerService } from "@/common/logger/winston-logger.service";

describe("RateLimitingService", () => {
  let rateLimitingService: RateLimitingService;
  let mockWinstonLoggerService: WinstonLoggerService;

  beforeEach(() => {
    mockWinstonLoggerService = {
      warn: vi.fn(),
      log: vi.fn(),
      error: vi.fn(),
    } as unknown as WinstonLoggerService;

    rateLimitingService = new RateLimitingService(mockWinstonLoggerService);
  });

  describe("getRateLimiterConfiguration", () => {
    it("should return default configuration when environment variables are not set", () => {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
      delete process.env.RATE_LIMIT_WINDOW_SECONDS;

      const configuration = rateLimitingService.getRateLimiterConfiguration();

      expect(configuration.maximumRequestsPerWindow).toBe(20);
      expect(configuration.windowDurationInSeconds).toBe(60);
    });

    it("should return configured values from environment variables", () => {
      process.env.RATE_LIMIT_MAX_REQUESTS = "50";
      process.env.RATE_LIMIT_WINDOW_SECONDS = "30";

      const configuration = rateLimitingService.getRateLimiterConfiguration();

      expect(configuration.maximumRequestsPerWindow).toBe(50);
      expect(configuration.windowDurationInSeconds).toBe(30);

      delete process.env.RATE_LIMIT_MAX_REQUESTS;
      delete process.env.RATE_LIMIT_WINDOW_SECONDS;
    });
  });

  describe("isRateLimitExceeded", () => {
    it("should return false for first request from an IP address", () => {
      const clientIpAddress = "192.168.1.1";

      const isExceeded = rateLimitingService.isRateLimitExceeded(clientIpAddress);

      expect(isExceeded).toBe(false);
    });

    it("should return false when request count is below limit", () => {
      const clientIpAddress = "192.168.1.2";

      rateLimitingService.isRateLimitExceeded(clientIpAddress);
      rateLimitingService.isRateLimitExceeded(clientIpAddress);
      rateLimitingService.isRateLimitExceeded(clientIpAddress);

      const isExceeded = rateLimitingService.isRateLimitExceeded(clientIpAddress);

      expect(isExceeded).toBe(false);
    });

    it("should track request counts correctly", () => {
      const clientIpAddress = "192.168.1.3";

      for (let requestIndex = 0; requestIndex < 19; requestIndex++) {
        const isExceeded = rateLimitingService.isRateLimitExceeded(clientIpAddress);
        expect(isExceeded).toBe(false);
      }
    });
  });

  describe("getRemainingRequests", () => {
    it("should return maximum requests for new IP address", () => {
      const clientIpAddress = "192.168.1.4";

      const remainingRequests = rateLimitingService.getRemainingRequests(clientIpAddress);

      expect(remainingRequests).toBe(20);
    });

    it("should return correct remaining requests after some requests", () => {
      const clientIpAddress = "192.168.1.5";

      rateLimitingService.isRateLimitExceeded(clientIpAddress);
      rateLimitingService.isRateLimitExceeded(clientIpAddress);
      rateLimitingService.isRateLimitExceeded(clientIpAddress);

      const remainingRequests = rateLimitingService.getRemainingRequests(clientIpAddress);

      expect(remainingRequests).toBe(17);
    });
  });

  describe("getRetryAfterSeconds", () => {
    it("should return 0 when there is no entry for IP address", () => {
      const clientIpAddress = "192.168.1.6";

      const retryAfterSeconds = rateLimitingService.getRetryAfterSeconds(clientIpAddress);

      expect(retryAfterSeconds).toBe(0);
    });
  });

  describe("cleanupExpiredEntries", () => {
    it("should not throw when cleaning up expired entries", () => {
      expect(() => rateLimitingService.cleanupExpiredEntries()).not.toThrow();
    });
  });
});