import { z } from "zod";

const riskSeverityValues = ["low", "medium", "high"] as const;

type RiskSeverityValue = (typeof riskSeverityValues)[number];

function isRiskSeverityValue(value: string): value is RiskSeverityValue {
  return riskSeverityValues.includes(value as RiskSeverityValue);
}

function normalizeRiskSeverityValue(rawSeverityValue: unknown): unknown {
  if (typeof rawSeverityValue === "string") {
    const normalizedSeverityValue = rawSeverityValue.trim().toLowerCase();
    return normalizedSeverityValue;
  }

  if (
    rawSeverityValue === null ||
    typeof rawSeverityValue !== "object" ||
    Array.isArray(rawSeverityValue)
  ) {
    return rawSeverityValue;
  }

  const severityContainer = rawSeverityValue as Record<string, unknown>;
  const preferredSeverityKeys = [
    "severity",
    "riskSeverity",
    "overallRiskLevel",
    "riskLevel",
    "level",
    "value",
    "label",
  ];

  for (const preferredSeverityKey of preferredSeverityKeys) {
    const candidateSeverityValue = severityContainer[preferredSeverityKey];
    const normalizedCandidateSeverityValue = normalizeRiskSeverityValue(
      candidateSeverityValue,
    );

    if (
      typeof normalizedCandidateSeverityValue === "string" &&
      isRiskSeverityValue(normalizedCandidateSeverityValue)
    ) {
      return normalizedCandidateSeverityValue;
    }
  }

  for (const candidateSeverityValue of Object.values(severityContainer)) {
    const normalizedCandidateSeverityValue = normalizeRiskSeverityValue(
      candidateSeverityValue,
    );

    if (
      typeof normalizedCandidateSeverityValue === "string" &&
      isRiskSeverityValue(normalizedCandidateSeverityValue)
    ) {
      return normalizedCandidateSeverityValue;
    }
  }

  return rawSeverityValue;
}

export const RiskSeveritySchema = z.preprocess(
  normalizeRiskSeverityValue,
  z.enum(riskSeverityValues),
);

export const ContractRiskFlagSchema = z.object({
  riskTitle: z.string(),
  affectedClauseDescription: z.string(),
  riskSeverity: RiskSeveritySchema,
  plainEnglishExplanation: z.string(),
  recommendedAction: z.string(),
});

export const ContractRiskAnalysisResultSchema = z.object({
  overallRiskLevel: RiskSeveritySchema,
  riskFlags: z.array(ContractRiskFlagSchema),
  totalHighSeverityRisks: z.coerce.number(),
  totalMediumSeverityRisks: z.coerce.number(),
  totalLowSeverityRisks: z.coerce.number(),
  riskAnalysisSummary: z.string(),
});

export type ContractRiskAnalysisResult = z.infer<
  typeof ContractRiskAnalysisResultSchema
>;
