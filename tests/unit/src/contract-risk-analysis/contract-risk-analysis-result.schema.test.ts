import { describe, expect, it } from "vitest";

import { ContractRiskAnalysisResultSchema } from "../../../../src/contract-risk-analysis/schemas/contract-risk-analysis-result.schema";

describe("ContractRiskAnalysisResultSchema", () => {
  it("should normalize object-based severity values from AI responses", () => {
    const schemaValidationResult = ContractRiskAnalysisResultSchema.safeParse({
      overallRiskLevel: {
        level: "HIGH",
      },
      riskFlags: [
        {
          riskTitle: "Unlimited liability",
          affectedClauseDescription:
            "The supplier has unlimited liability exposure.",
          riskSeverity: {
            severity: "medium",
          },
          plainEnglishExplanation:
            "One party could be responsible for unlimited losses.",
          recommendedAction: "Add a reasonable liability cap.",
        },
      ],
      totalHighSeverityRisks: "1",
      totalMediumSeverityRisks: "2",
      totalLowSeverityRisks: "0",
      riskAnalysisSummary: "The contract has elevated liability exposure.",
    });

    expect(schemaValidationResult.success).toBe(true);

    if (!schemaValidationResult.success) {
      return;
    }

    expect(schemaValidationResult.data.overallRiskLevel).toBe("high");
    expect(schemaValidationResult.data.riskFlags[0].riskSeverity).toBe(
      "medium",
    );
    expect(schemaValidationResult.data.totalHighSeverityRisks).toBe(1);
    expect(schemaValidationResult.data.totalMediumSeverityRisks).toBe(2);
    expect(schemaValidationResult.data.totalLowSeverityRisks).toBe(0);
  });

  it("should reject severity payloads that do not contain a valid enum value", () => {
    const schemaValidationResult = ContractRiskAnalysisResultSchema.safeParse({
      overallRiskLevel: {
        status: "critical",
      },
      riskFlags: [],
      totalHighSeverityRisks: 0,
      totalMediumSeverityRisks: 0,
      totalLowSeverityRisks: 0,
      riskAnalysisSummary: "No risks found.",
    });

    expect(schemaValidationResult.success).toBe(false);
  });
});
