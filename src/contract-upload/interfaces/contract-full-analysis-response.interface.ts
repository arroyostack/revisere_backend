import { ExtractedContractData } from '../../contract-extraction/schemas/extracted-contract-data.schema';
import { ContractRiskAnalysisResult } from '../../contract-risk-analysis/schemas/contract-risk-analysis-result.schema';
import { ContractSummaryResult } from '../../contract-summary/schemas/contract-summary-result.schema';

export interface ContractFullAnalysisResponse {
  originalFileName: string;
  extractedData: ExtractedContractData;
  riskAnalysis: ContractRiskAnalysisResult;
  summary: ContractSummaryResult;
}
