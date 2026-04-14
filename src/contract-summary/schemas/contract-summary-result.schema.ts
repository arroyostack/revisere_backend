import { z } from 'zod';

export const ContractSummaryResultSchema = z.object({
  oneSentenceDescription: z.string(),
  whatThisContractDoes: z.string(),
  whoIsInvolved: z.string(),
  mainObligationsForEachParty: z.array(
    z.object({
      partyName: z.string(),
      obligationsSummary: z.string(),
    }),
  ),
  importantDatesAndDeadlines: z.array(
    z.object({
      dateDescription: z.string(),
      dateValue: z.string(),
    }),
  ),
  whatHappensIfThingsGoWrong: z.string(),
  howToGetOut: z.string(),
  threeThingsToKnowBeforeSigning: z.array(z.string()),
});

export type ContractSummaryResult = z.infer<typeof ContractSummaryResultSchema>;
