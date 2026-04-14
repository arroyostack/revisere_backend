import { describe, it, expect, vi, beforeEach } from "vitest";
import { WinstonLoggerService } from "@/common/logger/winston-logger.service";

describe("WinstonLoggerService", () => {
  let winstonLoggerService: WinstonLoggerService;

  beforeEach(() => {
    winstonLoggerService = new WinstonLoggerService();
  });

  describe("log", () => {
    it("should log message without context", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      winstonLoggerService.log("Test message");
      consoleSpy.mockRestore();
    });

    it("should log message with context", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      winstonLoggerService.log("Test message", "TestContext");
      consoleSpy.mockRestore();
    });
  });

  describe("error", () => {
    it("should log error with trace", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      winstonLoggerService.error("Error message", "stack trace here", "ErrorContext");
      consoleSpy.mockRestore();
    });
  });

  describe("warn", () => {
    it("should log warning message", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      winstonLoggerService.warn("Warning message", "WarnContext");
      consoleSpy.mockRestore();
    });
  });

  describe("debug", () => {
    it("should log debug message", () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      winstonLoggerService.debug("Debug message", "DebugContext");
      consoleSpy.mockRestore();
    });
  });

  describe("verbose", () => {
    it("should log verbose message", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      winstonLoggerService.verbose("Verbose message", "VerboseContext");
      consoleSpy.mockRestore();
    });
  });

  describe("logHttpRequest", () => {
    it("should log HTTP request with all parameters", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      winstonLoggerService.logHttpRequest(
        "GET",
        "/api/contracts",
        "192.168.1.1",
        "Mozilla/5.0",
        "req-123-456"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("logHttpResponse", () => {
    it("should log HTTP response with all parameters", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      winstonLoggerService.logHttpResponse("req-123-456", 200, 150);

      consoleSpy.mockRestore();
    });
  });

  describe("logAIOperationStart", () => {
    it("should log AI operation start", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      winstonLoggerService.logAIOperationStart("contract-extraction", "openai", "gpt-4o");

      consoleSpy.mockRestore();
    });
  });

  describe("logAIOperationSuccess", () => {
    it("should log AI operation success", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      winstonLoggerService.logAIOperationSuccess("contract-extraction", "openai", 2500);

      consoleSpy.mockRestore();
    });
  });

  describe("logAIOperationFailure", () => {
    it("should log AI operation failure", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      winstonLoggerService.logAIOperationFailure("contract-extraction", "openai", "timeout error");

      consoleSpy.mockRestore();
    });
  });

  describe("logDocumentParseStart", () => {
    it("should log document parsing start", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      winstonLoggerService.logDocumentParseStart("contract.pdf", "application/pdf");

      consoleSpy.mockRestore();
    });
  });

  describe("logDocumentParseSuccess", () => {
    it("should log document parsing success", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      winstonLoggerService.logDocumentParseSuccess("contract.pdf", 5000);

      consoleSpy.mockRestore();
    });
  });

  describe("logDocumentParseFailure", () => {
    it("should log document parsing failure", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      winstonLoggerService.logDocumentParseFailure("contract.pdf", "invalid file format");

      consoleSpy.mockRestore();
    });
  });
});