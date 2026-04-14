import { z } from 'zod';

export const RiskSeveritySchema = z.enum(['low', 'medium', 'high']);

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
  totalHighSeverityRisks: z.number(),
  totalMediumSeverityRisks: z.number(),
  totalLowSeverityRisks: z.number(),
  riskAnalysisSummary: z.string(),
});

export type ContractRiskAnalysisResult = z.infer<typeof ContractRiskAnalysisResultSchema>;
