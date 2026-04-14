import { generateObject, generateText, zodSchema } from "ai";
import { z, ZodTypeAny } from "zod";
import { AiProviderFactoryService } from "./ai-provider-factory.service";
import { AiProviderConfiguration } from "./interfaces/ai-provider-configuration.interface";
import { SUPPORTED_AI_PROVIDERS } from "../common/constants/supported-ai-providers.constant";

interface GenerateStructuredObjectParams<TSchema extends ZodTypeAny> {
  aiProviderFactory: AiProviderFactoryService;
  providerConfiguration: AiProviderConfiguration;
  schema: TSchema;
  system: string;
  prompt: string;
}

function extractJsonObjectCandidates(text: string): string[] {
  const normalizedText = text.replace(/<think>[\s\S]*?<\/think>/gi, " ").trim();
  const candidates = new Set<string>();

  for (let start = 0; start < normalizedText.length; start += 1) {
    if (normalizedText[start] !== "{") {
      continue;
    }

    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let index = start; index < normalizedText.length; index += 1) {
      const character = normalizedText[index];

      if (inString) {
        if (isEscaped) {
          isEscaped = false;
          continue;
        }

        if (character === "\\") {
          isEscaped = true;
          continue;
        }

        if (character === '"') {
          inString = false;
        }

        continue;
      }

      if (character === '"') {
        inString = true;
        continue;
      }

      if (character === "{") {
        depth += 1;
        continue;
      }

      if (character !== "}") {
        continue;
      }

      depth -= 1;

      if (depth === 0) {
        candidates.add(normalizedText.slice(start, index + 1));
        break;
      }
    }
  }

  return Array.from(candidates);
}

function validateJsonResponseText<TSchema extends ZodTypeAny>(
  responseText: string,
  schema: TSchema,
): {
  data: z.infer<TSchema> | null;
  parseErrorMessage: string | null;
  validationErrorMessage: string | null;
} {
  const jsonCandidates = extractJsonObjectCandidates(responseText);

  if (jsonCandidates.length === 0) {
    return {
      data: null,
      parseErrorMessage: "no JSON object found.",
      validationErrorMessage: null,
    };
  }

  let parseErrorMessage: string | null = null;
  let validationErrorMessage: string | null = null;

  for (const jsonCandidate of jsonCandidates) {
    try {
      const parsedResult = JSON.parse(jsonCandidate);
      const validationResult = schema.safeParse(parsedResult);

      if (validationResult.success) {
        return {
          data: validationResult.data,
          parseErrorMessage: null,
          validationErrorMessage: null,
        };
      }

      if (validationErrorMessage === null) {
        validationErrorMessage = validationResult.error.message;
      }
    } catch (error) {
      if (parseErrorMessage === null && error instanceof Error) {
        parseErrorMessage = error.message;
      }
    }
  }

  return {
    data: null,
    parseErrorMessage,
    validationErrorMessage,
  };
}

export async function generateStructuredObject<TSchema extends ZodTypeAny>({
  aiProviderFactory,
  providerConfiguration,
  schema,
  system,
  prompt,
}: GenerateStructuredObjectParams<TSchema>): Promise<z.infer<TSchema>> {
  const model = aiProviderFactory.resolveLanguageModel(providerConfiguration);

  if (providerConfiguration.providerName !== SUPPORTED_AI_PROVIDERS.MINIMAX) {
    const result = await generateObject({
      model,
      schema,
      system,
      prompt,
    });

    return result.object;
  }

  const structuredSchema = zodSchema(schema);
  const jsonInstructions = `Return exactly one valid JSON object. Do not include markdown fences, explanations, thinking text, or extra text before or after the JSON. Include every required key from the schema exactly once. The JSON must conform exactly to this schema:\n${JSON.stringify(structuredSchema.jsonSchema)}`;
  const result = await generateText({
    model,
    system: `${system}\n\n${jsonInstructions}`,
    prompt,
    temperature: 0.1,
  });
  const initialValidation = validateJsonResponseText(result.text, schema);

  if (initialValidation.data !== null) {
    return initialValidation.data;
  }

  const repairFailureMessage =
    initialValidation.validationErrorMessage ??
    initialValidation.parseErrorMessage ??
    "unknown validation failure";

  const repairedResult = await generateText({
    model,
    system: `${system}\n\n${jsonInstructions}`,
    prompt: `Your previous response did not satisfy the schema. Repair it and return a corrected JSON object only.\n\nOriginal task:\n${prompt}\n\nSchema:\n${JSON.stringify(structuredSchema.jsonSchema)}\n\nValidation failure:\n${repairFailureMessage}\n\nPrevious response:\n${result.text}`,
    temperature: 0.1,
  });

  const repairedValidation = validateJsonResponseText(
    repairedResult.text,
    schema,
  );

  if (repairedValidation.data !== null) {
    return repairedValidation.data;
  }

  if (repairedValidation.validationErrorMessage !== null) {
    throw new Error(
      `MiniMax returned JSON that did not match schema: ${repairedValidation.validationErrorMessage}`,
    );
  }

  if (repairedValidation.parseErrorMessage !== null) {
    throw new Error(
      `MiniMax returned invalid JSON: ${repairedValidation.parseErrorMessage}`,
    );
  }

  throw new Error("MiniMax returned invalid JSON.");
}
