import { z } from 'zod';

export const ContractPartySchema = z.object({
  partyName: z.string(),
  partyRole: z.string(),
  jurisdiction: z.string().optional(),
});

export const ContractObligationSchema = z.object({
  obligatedPartyName: z.string(),
  obligationDescription: z.string(),
  dueDateOrCondition: z.string().optional(),
});

export const ContractTerminationConditionsSchema = z.object({
  noticePeriodInDays: z.number().optional(),
  terminationConditions: z.array(z.string()),
  hasAutomaticRenewal: z.boolean(),
  automaticRenewalDescription: z.string().optional(),
});

export const ContractPaymentTermsSchema = z.object({
  paymentAmount: z.string().optional(),
  paymentCurrency: z.string().optional(),
  paymentScheduleDescription: z.string().optional(),
  latePenaltyDescription: z.string().optional(),
});

export const ExtractedContractDataSchema = z.object({
  contractTitle: z.string(),
  contractType: z.string(),
  parties: z.array(ContractPartySchema),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  governingLaw: z.string().optional(),
  paymentTerms: ContractPaymentTermsSchema.optional(),
  terminationConditions: ContractTerminationConditionsSchema,
  keyObligations: z.array(ContractObligationSchema),
  confidentialityClauseExists: z.boolean(),
  nonCompeteClauseExists: z.boolean(),
  intellectualPropertyClauseExists: z.boolean(),
  disputeResolutionMethod: z.string().optional(),
});

export type ExtractedContractData = z.infer<typeof ExtractedContractDataSchema>;
