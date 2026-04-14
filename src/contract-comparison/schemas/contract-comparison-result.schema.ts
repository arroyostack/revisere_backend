import { z } from 'zod';

export const ChangeDirectionSchema = z.enum([
  'favors_first_party',
  'favors_second_party',
  'neutral',
  'unclear',
]);

export const ContractChangeItemSchema = z.object({
  changeTitle: z.string(),
  whatChangedDescription: z.string(),
  changeDirection: ChangeDirectionSchema,
  plainEnglishExplanation: z.string(),
  significanceLevel: z.enum(['minor', 'moderate', 'significant']),
});

export const ContractComparisonResultSchema = z.object({
  firstContractTitle: z.string(),
  secondContractTitle: z.string(),
  overallAssessment: z.string(),
  totalChangesDetected: z.number(),
  identifiedChanges: z.array(ContractChangeItemSchema),
  clausesAddedInSecondContract: z.array(z.string()),
  clausesRemovedFromFirstContract: z.array(z.string()),
  whichVersionIsFavorable: z.enum([
    'first_version',
    'second_version',
    'roughly_equal',
    'depends_on_your_role',
  ]),
  favorabilityExplanation: z.string(),
  recommendationBeforeSigning: z.string(),
});

export type ContractComparisonResult = z.infer<typeof ContractComparisonResultSchema>;
