import { z } from "zod";

export const ContractPartySchema = z.object({
  partyName: z.string(),
  partyRole: z.string(),
  jurisdiction: z.string().nullish(),
});

export const ContractObligationSchema = z.object({
  obligatedPartyName: z.string(),
  obligationDescription: z.string(),
  dueDateOrCondition: z.string().nullish(),
});

export const ContractTerminationConditionsSchema = z.object({
  noticePeriodInDays: z.number().nullish(),
  terminationConditions: z.array(z.string()),
  hasAutomaticRenewal: z.boolean(),
  automaticRenewalDescription: z.string().nullish(),
});

export const ContractPaymentTermsSchema = z.object({
  paymentAmount: z.string().nullish(),
  paymentCurrency: z.string().nullish(),
  paymentScheduleDescription: z.string().nullish(),
  latePenaltyDescription: z.string().nullish(),
});

export const ExtractedContractDataSchema = z.object({
  contractTitle: z.string(),
  contractType: z.string(),
  parties: z.array(ContractPartySchema),
  effectiveDate: z.string().nullish(),
  expirationDate: z.string().nullish(),
  governingLaw: z.string().nullish(),
  paymentTerms: ContractPaymentTermsSchema.nullish(),
  terminationConditions: ContractTerminationConditionsSchema,
  keyObligations: z.array(ContractObligationSchema),
  confidentialityClauseExists: z.boolean(),
  nonCompeteClauseExists: z.boolean(),
  intellectualPropertyClauseExists: z.boolean(),
  disputeResolutionMethod: z.string().nullish(),
});

export type ExtractedContractData = z.infer<typeof ExtractedContractDataSchema>;
