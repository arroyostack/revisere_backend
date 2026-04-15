import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

export interface HealthCheckResponse {
  serviceStatus: string;
  timestamp: string;
  documentationUrl: string;
}

@ApiTags("Health")
@Controller()
export class HealthController {
  @ApiOperation({
    summary: "Service health check",
    description:
      "Returns the current health status of the Revisere Backend service. Use this endpoint to verify the service is running and responsive.",
  })
  @ApiResponse({
    status: 200,
    description: "Service is healthy and operational.",
    schema: {
      type: "object",
      properties: {
        serviceStatus: {
          type: "string",
          example: "operational",
          description: "Current operational status of the service",
        },
        timestamp: {
          type: "string",
          example: "2024-01-15T10:30:00.000Z",
          description: "ISO 8601 timestamp of the health check",
        },
        documentationUrl: {
          type: "string",
          example: "/api/docs",
          description: "Path to the API documentation endpoint",
        },
      },
    },
  })
  @Get("health")
  getHealthCheck(): HealthCheckResponse {
    const currentTimestamp = new Date().toISOString();

    return {
      serviceStatus: "operational",
      timestamp: currentTimestamp,
      documentationUrl: "/api/docs",
    };
  }
}
