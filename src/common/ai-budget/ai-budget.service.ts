import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { WinstonLoggerService } from "../logger/winston-logger.service";

interface DailyBudgetEntry {
  callCount: number;
  resetDate: string; // YYYY-MM-DD
}

interface IpDailyEntry {
  aiCallsToday: number;
  resetDate: string;
}

@Injectable()
export class AiBudgetService {
  // Global daily AI call budget (across all users)
  private globalDailyCalls: number = 0;
  private globalBudgetResetDate: string = this.getTodayDate();
  
  // Per-IP daily AI call limits
  private readonly ipDailyUsage: Map<string, IpDailyEntry> = new Map();
  
  // Configuration
  private readonly defaultGlobalDailyBudget: number = 500;
  private readonly defaultPerIpDailyLimit: number = 300; // 300 AI calls/IP/day = ~100 contract analyses

  constructor(private readonly winstonLoggerService: WinstonLoggerService) {}

  private getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  private getGlobalBudgetConfiguration(): number {
    const configuredBudget = process.env.AI_DAILY_CALL_BUDGET;
    return configuredBudget
      ? parseInt(configuredBudget, 10)
      : this.defaultGlobalDailyBudget;
  }

  private getPerIpDailyLimitConfiguration(): number {
    const configuredLimit = process.env.AI_PER_IP_DAILY_LIMIT;
    return configuredLimit
      ? parseInt(configuredLimit, 10)
      : this.defaultPerIpDailyLimit;
  }

  private checkAndResetGlobalBudget(): void {
    const today = this.getTodayDate();
    if (today !== this.globalBudgetResetDate) {
      this.globalDailyCalls = 0;
      this.globalBudgetResetDate = today;
    }
  }

  private checkAndResetIpUsage(clientIp: string): void {
    const today = this.getTodayDate();
    const entry = this.ipDailyUsage.get(clientIp);
    
    if (!entry || entry.resetDate !== today) {
      this.ipDailyUsage.set(clientIp, {
        aiCallsToday: 0,
        resetDate: today,
      });
    }
  }

  isGlobalBudgetExceeded(): boolean {
    this.checkAndResetGlobalBudget();
    const budget = this.getGlobalBudgetConfiguration();
    return this.globalDailyCalls >= budget;
  }

  isIpDailyLimitExceeded(clientIp: string): boolean {
    this.checkAndResetIpUsage(clientIp);
    const entry = this.ipDailyUsage.get(clientIp);
    const limit = this.getPerIpDailyLimitConfiguration();
    return entry ? entry.aiCallsToday >= limit : false;
  }

  canMakeAiCall(clientIp: string): { allowed: boolean; reason?: string } {
    // Check global budget first
    if (this.isGlobalBudgetExceeded()) {
      this.winstonLoggerService.warn(
        `Global AI budget exceeded (${this.globalDailyCalls}/${this.getGlobalBudgetConfiguration()} calls today)`,
        "AiBudget"
      );
      return { 
        allowed: false, 
        reason: "Daily AI budget exhausted. Please try again tomorrow." 
      };
    }

    // Check per-IP limit
    if (this.isIpDailyLimitExceeded(clientIp)) {
      this.winstonLoggerService.warn(
        `Per-IP AI budget exceeded for IP: ${clientIp}`,
        "AiBudget"
      );
      return { 
        allowed: false, 
        reason: "Daily limit exceeded for this IP. Please try again tomorrow." 
      };
    }

    return { allowed: true };
  }

  recordAiCall(clientIp: string, callCount: number = 1): void {
    this.checkAndResetGlobalBudget();
    this.checkAndResetIpUsage(clientIp);

    this.globalDailyCalls += callCount;

    const entry = this.ipDailyUsage.get(clientIp);
    if (entry) {
      entry.aiCallsToday += callCount;
    }

    this.winstonLoggerService.debug(
      `AI call recorded: IP=${clientIp}, Count=${callCount}, Global=${this.globalDailyCalls}`,
      "AiBudget"
    );
  }

  getGlobalBudgetRemaining(): number {
    this.checkAndResetGlobalBudget();
    const budget = this.getGlobalBudgetConfiguration();
    return Math.max(0, budget - this.globalDailyCalls);
  }

  getIpDailyRemaining(clientIp: string): number {
    this.checkAndResetIpUsage(clientIp);
    const entry = this.ipDailyUsage.get(clientIp);
    const limit = this.getPerIpDailyLimitConfiguration();
    return entry 
      ? Math.max(0, limit - entry.aiCallsToday)
      : limit;
  }

  throwIfBudgetExceeded(clientIp: string): void {
    const { allowed, reason } = this.canMakeAiCall(clientIp);
    if (!allowed) {
      throw new ServiceUnavailableException(reason);
    }
  }

  // Record AI calls for a contract analysis (3 calls: extraction, risk, summary)
  recordContractAnalysis(clientIp: string): void {
    this.recordAiCall(clientIp, 3);
  }

  // Clean up expired entries (call periodically)
  cleanupExpiredEntries(): void {
    const today = this.getTodayDate();
    for (const [ip, entry] of this.ipDailyUsage.entries()) {
      if (entry.resetDate !== today) {
        this.ipDailyUsage.delete(ip);
      }
    }
  }
}
