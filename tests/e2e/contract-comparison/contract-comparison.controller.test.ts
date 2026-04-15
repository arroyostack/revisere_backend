import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { MulterModule } from "@nestjs/platform-express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ContractComparisonController } from "../../../src/contract-comparison/contract-comparison.controller";
import { ContractComparisonService } from "../../../src/contract-comparison/contract-comparison.service";
import { ContractComparisonResult } from "../../../src/contract-comparison/schemas/contract-comparison-result.schema";
import { DocumentParsingService } from "../../../src/document-parsing/document-parsing.service";
import { AiConfigService } from "../../../src/ai-config/ai-config.service";
import { GlobalHttpExceptionFilter } from "../../../src/common/filters/global-http-exception.filter";
import { CONTRACT_FILE_UPLOAD } from "../../../src/common/constants/contract-file-upload.constant";

describe("ContractComparisonController", () => {
  let contractComparisonApplication: INestApplication;
  let contractComparisonController: ContractComparisonController;
  let documentParsingServiceDouble: {
    parseDocument: ReturnType<typeof vi.fn>;
  };
  let contractComparisonServiceDouble: {
    compareContracts: ReturnType<typeof vi.fn>;
  };
  let aiConfigServiceDouble: {
    getProviderConfiguration: ReturnType<typeof vi.fn>;
  };

  const parsedOriginalContractDocument = {
    plainText: "Original contract text",
    originalFileName: "original-contract.pdf",
  };

  const parsedRevisedContractDocument = {
    plainText: "Revised contract text",
    originalFileName: "revised-contract.pdf",
  };

  const generatedComparisonResult: ContractComparisonResult = {
    firstContractTitle: "Original contract title",
    secondContractTitle: "Revised contract title",
    overallAssessment: "The revised contract changes payment terms.",
    totalChangesDetected: 1,
    identifiedChanges: [
      {
        changeTitle: "Payment clause updated",
        whatChangedDescription: "Payment changed from net 30 to net 15.",
        changeDirection: "favors_second_party",
        plainEnglishExplanation: "The revised version requires payment sooner.",
        significanceLevel: "moderate",
      },
    ],
    clausesAddedInSecondContract: ["Expedited payment clause"],
    clausesRemovedFromFirstContract: [],
    whichVersionIsFavorable: "depends_on_your_role",
    favorabilityExplanation:
      "The better version depends on whether you pay or receive funds.",
    recommendationBeforeSigning:
      "Review the revised payment timing before signing.",
  };

  beforeAll(async () => {
    documentParsingServiceDouble = {
      parseDocument: vi.fn(),
    };
    contractComparisonServiceDouble = {
      compareContracts: vi.fn(),
    };
    aiConfigServiceDouble = {
      getProviderConfiguration: vi.fn(),
    };

    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        MulterModule.register({
          limits: {
            fileSize: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES,
          },
        }),
      ],
      controllers: [ContractComparisonController],
      providers: [
        {
          provide: DocumentParsingService,
          useValue: documentParsingServiceDouble,
        },
        {
          provide: ContractComparisonService,
          useValue: contractComparisonServiceDouble,
        },
        {
          provide: AiConfigService,
          useValue: aiConfigServiceDouble,
        },
      ],
    }).compile();

    contractComparisonController = testingModule.get(
      ContractComparisonController,
    );
    Object.assign(contractComparisonController, {
      documentParsingService: documentParsingServiceDouble,
      contractComparisonService: contractComparisonServiceDouble,
      aiConfigService: aiConfigServiceDouble,
    });

    contractComparisonApplication = testingModule.createNestApplication();
    contractComparisonApplication.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );
    contractComparisonApplication.useGlobalFilters(
      new GlobalHttpExceptionFilter(),
    );

    await contractComparisonApplication.init();
    await contractComparisonApplication.listen(0);
  });

  afterAll(async () => {
    await contractComparisonApplication.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    aiConfigServiceDouble.getProviderConfiguration.mockReturnValue({
      providerName: "openai",
      apiKey: "test-api-key",
    });
    documentParsingServiceDouble.parseDocument
      .mockResolvedValueOnce(parsedOriginalContractDocument)
      .mockResolvedValueOnce(parsedRevisedContractDocument);
    contractComparisonServiceDouble.compareContracts.mockResolvedValue(
      generatedComparisonResult,
    );
  });

  async function sendContractComparisonRequest(
    requestBody: FormData,
  ): Promise<Response> {
    const applicationBaseUrl = await contractComparisonApplication.getUrl();

    return fetch(`${applicationBaseUrl}/contract-comparison/compare`, {
      method: "POST",
      body: requestBody,
    });
  }

  function createPdfUpload(documentBodyText: string): Blob {
    return new Blob([`%PDF-1.4\n${documentBodyText}`], {
      type: "application/pdf",
    });
  }

  it("should accept both contract files when uploaded with the expected multipart field names", async () => {
    const contractComparisonRequestBody = new FormData();
    contractComparisonRequestBody.append(
      "firstContractFile",
      createPdfUpload("Original contract body"),
      "original-contract.pdf",
    );
    contractComparisonRequestBody.append(
      "secondContractFile",
      createPdfUpload("Revised contract body"),
      "revised-contract.pdf",
    );

    const comparisonResponse = await sendContractComparisonRequest(
      contractComparisonRequestBody,
    );
    const comparisonResponseBody =
      (await comparisonResponse.json()) as ContractComparisonResult;

    expect(comparisonResponse.status).toBe(201);
    expect(documentParsingServiceDouble.parseDocument).toHaveBeenNthCalledWith(
      1,
      expect.any(Buffer),
      "original-contract.pdf",
      "application/pdf",
    );
    expect(documentParsingServiceDouble.parseDocument).toHaveBeenNthCalledWith(
      2,
      expect.any(Buffer),
      "revised-contract.pdf",
      "application/pdf",
    );
    expect(
      contractComparisonServiceDouble.compareContracts,
    ).toHaveBeenCalledWith(
      parsedOriginalContractDocument.plainText,
      parsedRevisedContractDocument.plainText,
      {
        providerName: "openai",
        apiKey: "test-api-key",
      },
    );
    expect(comparisonResponseBody).toEqual({
      ...generatedComparisonResult,
      firstContractTitle: parsedOriginalContractDocument.originalFileName,
      secondContractTitle: parsedRevisedContractDocument.originalFileName,
    });
  });

  it("should reject the request when the first contract file is missing", async () => {
    const contractComparisonRequestBody = new FormData();
    contractComparisonRequestBody.append(
      "secondContractFile",
      createPdfUpload("Revised contract body"),
      "revised-contract.pdf",
    );

    const comparisonResponse = await sendContractComparisonRequest(
      contractComparisonRequestBody,
    );
    const comparisonResponseBody = (await comparisonResponse.json()) as Record<
      string,
      unknown
    >;

    expect(comparisonResponse.status).toBe(400);
    expect(comparisonResponseBody).toEqual({
      statusCode: 400,
      message: "First contract file is required",
      error: "Bad Request",
    });
    expect(documentParsingServiceDouble.parseDocument).not.toHaveBeenCalled();
    expect(
      contractComparisonServiceDouble.compareContracts,
    ).not.toHaveBeenCalled();
  });
});
