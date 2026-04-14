# Revisere Backend

**Revisere** (Latin: "to look again, examine carefully") is an AI-powered legal contract analysis API that helps legal professionals and individuals understand, assess, and compare contracts with confidence.

The backend service handles the heavy lifting: extracting structured data from contracts, identifying potential risks, generating plain-English summaries, and comparing contract versions to highlight what changed.

## Table of Contents

- [Overview](#overview)
- [What This Service Does](#what-this-service-does)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Production Considerations](#production-considerations)
- [License](#license)

---

## Overview

Revisere Backend is a NestJS-based REST API that processes legal documents using AI. It accepts PDF and DOCX files and returns structured JSON with:

- **Parties and their roles** (e.g., landlord/tenant, employer/employee)
- **Key obligations** for each party with due dates
- **Payment terms** including amounts, schedules, and penalties
- **Termination conditions** and notice requirements
- **Risk flags** with severity levels and recommendations
- **Plain-English summaries** that make legal jargon accessible
- **Version comparison** that highlights what changed between contract drafts

---

## What This Service Does

### Contract Analysis

Upload a single contract and receive a comprehensive analysis:

| Output Section | What It Contains |
|---------------|------------------|
| Extracted Data | Parties, dates, payment terms, obligations, clauses |
| Risk Analysis | Flagged risks with severity (high/medium/low) and recommended actions |
| Summary | Plain-English description anyone can understand |

### Contract Comparison

Upload two versions of the same contract and receive:

| Output Section | What It Contains |
|---------------|------------------|
| Identified Changes | All modifications with explanation of impact |
| Change Direction | Whether the change favors the first or second party |
| Favorability | Which version is more advantageous overall |
| Recommendations | Advice on what to negotiate before signing |

---

## Architecture

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 10
- **Language**: TypeScript (strict mode)
- **AI Integration**: Vercel AI SDK with multi-provider support
- **Logging**: Winston with structured JSON output
- **Testing**: Vitest

### Project Structure

```
src/
├── main.ts                              # Application bootstrap
├── app.module.ts                        # Root module with middleware configuration
│
├── ai-config/                           # AI provider configuration
│   ├── ai-config.module.ts
│   └── ai-config.service.ts             # Reads provider settings from environment
│
├── ai-provider/                        # AI provider abstraction
│   ├── ai-provider.module.ts
│   ├── ai-provider-factory.service.ts  # Creates AI client instances
│   ├── generate-structured-object.ts   # Structured output wrapper
│   └── interfaces/
│       └── ai-provider-configuration.interface.ts
│
├── document-parsing/                   # Document processing
│   ├── document-parsing.module.ts
│   └── document-parsing.service.ts     # PDF/DOCX to text conversion
│
├── contract-extraction/                # Data extraction
│   ├── contract-extraction.module.ts
│   ├── contract-extraction.service.ts  # AI-powered extraction
│   └── schemas/
│       └── extracted-contract-data.schema.ts
│
├── contract-risk-analysis/             # Risk identification
│   ├── contract-risk-analysis.module.ts
│   ├── contract-risk-analysis.service.ts
│   └── schemas/
│       └── contract-risk-analysis-result.schema.ts
│
├── contract-summary/                   # Summarization
│   ├── contract-summary.module.ts
│   ├── contract-summary.service.ts
│   └── schemas/
│       └── contract-summary-result.schema.ts
│
├── contract-upload/                   # Analysis endpoint
│   ├── contract-upload.module.ts
│   ├── contract-upload.controller.ts  # POST /contract-analysis/analyze
│   ├── interfaces/
│   │   └── contract-full-analysis-response.interface.ts
│   └── pipes/
│       └── contract-file-validation.pipe.ts
│
├── contract-comparison/                # Comparison endpoint
│   ├── contract-comparison.module.ts
│   ├── contract-comparison.controller.ts  # POST /contract-comparison/compare
│   ├── contract-comparison.service.ts
│   └── schemas/
│       └── contract-comparison-result.schema.ts
│
├── health/                            # Health check endpoint
│   ├── health.module.ts
│   └── health.controller.ts         # GET /health
│
└── common/                           # Shared utilities
    ├── common.module.ts             # Rate limiting module
    ├── constants/                    # App-wide constants
    │   ├── contract-file-upload.constant.ts
    │   └── supported-ai-providers.constant.ts
    ├── dto/                          # Data transfer objects
    │   └── ai-provider-request.dto.ts
    ├── errors/                       # Error handling
    │   ├── app-error.ts
    │   ├── error-code.ts
    │   └── index.ts
    ├── filters/                      # Exception filters
    │   └── global-http-exception.filter.ts
    ├── logger/                       # Structured logging
    │   ├── logger.module.ts
    │   ├── winston-logger.service.ts
    │   └── interfaces/
    │       └── log-level.enum.ts
    ├── middleware/                  # Request middleware
    │   ├── http-logging.middleware.ts   # Request/response logging
    │   └── rate-limiting.middleware.ts  # Rate limit enforcement
    ├── rate-limiting/                # Rate limiting service
    │   └── rate-limiting.service.ts
    └── types/                        # Type definitions
        └── api-error-response.type.ts
```

### Design Decisions

| Pattern | Where Used | Why |
|---------|-----------|-----|
| **Factory** | `AiProviderFactoryService` | Easy to add new AI providers without modifying existing code |
| **Retry with Backoff** | `ContractExtractionService` | Handles transient AI failures gracefully |
| **Parallel Execution** | Controllers | Reduces response time by running analyses concurrently |
| **Middleware** | Logging, Rate Limiting | Applied globally without touching business logic |
| **Validation Pipes** | File upload | Validates files before any processing begins |

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, pnpm, or yarn
- API key for at least one supported AI provider

### Supported AI Providers

| Provider | Default Model | Best For |
|----------|--------------|----------|
| OpenAI | gpt-4o | Balanced performance and capabilities |
| Anthropic | claude-sonnet-4-20250514 | Strong reasoning and analysis |
| Groq | llama-3.3-70b-versatile | Fast inference, lower costs |
| Google | gemini-1.5-pro | Large context windows |
| MiniMax | MiniMax-M2 | OpenAI-compatible API |

### Installation

```bash
# Clone the repository
git clone https://github.com/arroyostack/revisere_backend.git
cd revisere_backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### Running the Application

```bash
# Development (hot reload enabled)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000` by default.

### Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# View API documentation
# Open http://localhost:3000/api/docs in your browser
```

---

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and set your values:

```bash
# Required: AI Provider Setup
AI_PROVIDER=openai
AI_API_KEY=your-api-key-here

# Optional: Model override (uses provider default if empty)
AI_MODEL_IDENTIFIER=

# Logging: Controls verbosity (error, warn, info, debug, verbose)
LOG_LEVEL=info

# Rate Limiting: Protect your API from abuse
# Maximum requests allowed per IP within the time window
RATE_LIMIT_MAX_REQUESTS=100
# Time window in seconds
RATE_LIMIT_WINDOW_SECONDS=60
```

### Configuration Validation

The application will fail to start if `AI_PROVIDER` or `AI_API_KEY` are missing. All other settings have sensible defaults.

---

## API Reference

### Contract Analysis

**Endpoint**: `POST /contract-analysis/analyze`

Analyzes a single contract document and returns structured extraction, risk assessment, and summary.

**Request**

```
Content-Type: multipart/form-data
Body:
  - contractFile: PDF or DOCX file (max 10MB)
```

**Response** (200 OK)

```json
{
  "originalFileName": "lease-agreement.pdf",
  "extractedData": {
    "contractTitle": "Residential Lease Agreement",
    "contractType": "Lease Agreement",
    "parties": [
      { "partyName": "John Smith", "partyRole": "Landlord", "jurisdiction": "California" },
      { "partyName": "Jane Doe", "partyRole": "Tenant", "jurisdiction": null }
    ],
    "effectiveDate": "2024-01-15",
    "expirationDate": "2025-01-14",
    "governingLaw": "California Civil Code",
    "paymentTerms": {
      "paymentAmount": "$2,500",
      "paymentCurrency": "USD",
      "paymentScheduleDescription": "Due on the 1st of each month",
      "latePenaltyDescription": "$100 per day after 5-day grace period"
    },
    "terminationConditions": {
      "noticePeriodInDays": 30,
      "terminationConditions": ["Non-payment", "Lease violation", "Mutual agreement"],
      "hasAutomaticRenewal": true,
      "automaticRenewalDescription": "Month-to-month after expiration"
    },
    "keyObligations": [
      { "obligatedPartyName": "Tenant", "obligationDescription": "Pay rent by due date", "dueDateOrCondition": "1st of each month" }
    ],
    "confidentialityClauseExists": false,
    "nonCompeteClauseExists": false,
    "intellectualPropertyClauseExists": false,
    "disputeResolutionMethod": "Binding Arbitration"
  },
  "riskAnalysis": {
    "overallRiskLevel": "medium",
    "riskFlags": [
      {
        "riskTitle": "Automatic Renewal Without Notice",
        "affectedClauseDescription": "Contract renews automatically to month-to-month",
        "riskSeverity": "high",
        "plainEnglishExplanation": "You may be locked into the contract without realizing it if you forget to give notice",
        "recommendedAction": "Set a calendar reminder 60 days before expiration to evaluate whether to continue"
      }
    ],
    "totalHighSeverityRisks": 1,
    "totalMediumSeverityRisks": 0,
    "totalLowSeverityRisks": 0,
    "riskAnalysisSummary": "This lease contains standard terms with moderate risk. The automatic renewal clause is the primary concern."
  },
  "summary": {
    "oneSentenceDescription": "A 12-month residential lease for a single-family home with $2,500 monthly rent.",
    "whatThisContractDoes": "This agreement establishes the terms under which Jane Doe will rent property from John Smith for one year.",
    "whoIsInvolved": "John Smith acts as the Landlord and Jane Doe as the Tenant.",
    "mainObligationsForEachParty": [
      { "partyName": "Tenant", "obligationsSummary": "Pay $2,500 rent monthly, maintain the property, and provide 30-day notice before vacating." },
      { "partyName": "Landlord", "obligationsSummary": "Provide habitable housing, complete repairs within reasonable timeframes, and respect tenant privacy." }
    ],
    "importantDatesAndDeadlines": [
      { "dateDescription": "Lease Start Date", "dateValue": "January 15, 2024" },
      { "dateDescription": "Rent Due Date", "dateValue": "1st of each month" },
      { "dateDescription": "Lease Expiration", "dateValue": "January 14, 2025" }
    ],
    "whatHappensIfThingsGoWrong": "If you fail to pay rent, the landlord can initiate eviction after proper notice.",
    "howToGetOut": "Either party may terminate with 30 days written notice after the initial term expires.",
    "threeThingsToKnowBeforeSigning": [
      "The lease automatically renews to month-to-month if neither party gives notice",
      "Late rent incurs $100 per day penalty after the 5-day grace period",
      "Security deposit amount and return timeline are not specified in this document"
    ]
  }
}
```

**Error Responses**

| Status | When | Example |
|--------|------|---------|
| 400 | Invalid file type | Only PDF and DOCX accepted |
| 413 | File too large | Maximum 10MB |
| 429 | Rate limit exceeded | See Retry-After header |
| 500 | AI service error | Check logs for details |

---

### Contract Comparison

**Endpoint**: `POST /contract-comparison/compare`

Compares two versions of the same contract and identifies what changed.

**Request**

```
Content-Type: multipart/form-data
Body:
  - firstContractFile: PDF or DOCX (the "before" version)
  - secondContractFile: PDF or DOCX (the "after" version)
```

**Response** (200 OK)

```json
{
  "firstContractTitle": "lease-2023.pdf",
  "secondContractTitle": "lease-2024.pdf",
  "overallAssessment": "The 2024 version contains significant changes to payment terms and termination clauses that shift risk toward the tenant.",
  "totalChangesDetected": 4,
  "identifiedChanges": [
    {
      "changeTitle": "Rent Increase",
      "whatChangedDescription": "Monthly rent increased from $2,000 to $2,500",
      "changeDirection": "favors_first_party",
      "plainEnglishExplanation": "The landlord increased your monthly payment by $500 without corresponding service improvements",
      "significanceLevel": "significant"
    },
    {
      "changeTitle": "Notice Period Reduction",
      "whatChangedDescription": "Termination notice period reduced from 60 to 30 days",
      "changeDirection": "favors_second_party",
      "plainEnglishExplanation": "You now have more flexibility to end the agreement with shorter notice",
      "significanceLevel": "minor"
    }
  ],
  "clausesAddedInSecondContract": ["Automatic renewal clause", "Pet policy amendment"],
  "clausesRemovedFromFirstContract": ["Parking space allocation"],
  "whichVersionIsFavorable": "first_version",
  "favorabilityExplanation": "Despite a shorter notice period being tenant-friendly, the rent increase and removal of parking rights make the first version more favorable overall.",
  "recommendationBeforeSigning": "Negotiate the rent increase back to $2,200 or request additional amenities to justify the higher cost."
}
```

**Change Direction Values**

| Value | Meaning |
|-------|---------|
| `favors_first_party` | The first contract version is more favorable |
| `favors_second_party` | The second contract version is more favorable |
| `neutral` | Change doesn't significantly favor either party |

---

### Health Check

**Endpoint**: `GET /health`

Returns service health status. Useful for load balancers and monitoring.

**Response** (200 OK)

```json
{
  "serviceStatus": "operational",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "documentationUrl": "/api/docs"
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `FRONTEND_ORIGIN` | No | http://localhost:5173 | Allowed CORS origin for browser requests |
| `AI_PROVIDER` | Yes | - | AI provider name (openai, anthropic, groq, google, minimax) |
| `AI_API_KEY` | Yes | - | API key for the selected provider |
| `AI_MODEL_IDENTIFIER` | No | provider default | Override the default model (e.g., use gpt-4-turbo instead of gpt-4o) |
| `LOG_LEVEL` | No | info | Logging verbosity (error, warn, info, debug, verbose) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per IP within the time window |
| `RATE_LIMIT_WINDOW_SECONDS` | No | 60 | Duration of the rate limit window in seconds |

---

## Development

### Running Tests

```bash
# Unit tests (fast, no external dependencies)
npm run test:unit

# Test coverage report
npm run test:coverage

# Watch mode for development
npm run test:unit -- --watch
```

### Code Quality

```bash
# Linting
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### API Documentation

Interactive Swagger documentation is available at `/api/docs` when the server is running. You can test endpoints directly from the browser.

---

## Production Considerations

### Logging

The service uses Winston for structured logging. Logs are output in JSON format for easy parsing by log aggregators (ELK, Datadog, etc.):

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Outgoing HTTP response",
  "context": "HTTP",
  "service": "revisere-backend",
  "httpRequestId": "abc-123",
  "httpResponseStatusCode": 200,
  "httpResponseLatencyMs": 450
}
```

### Rate Limiting

The service includes built-in rate limiting to prevent abuse:

- Default: 100 requests per minute per IP address
- Configurable via environment variables
- Returns HTTP 429 with `Retry-After` header when exceeded
- Headers included in every response: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Security

- File validation at the controller level before any processing
- Global exception filter returns consistent error responses
- CORS configured to allow frontend origin only
- No sensitive data in error messages (API keys never logged)

### Scaling

This is a stateless service suitable for horizontal scaling. For production:

- Deploy behind a load balancer
- Use a Redis-based rate limiter for distributed environments
- Consider adding authentication if exposing publicly

---

## License

ISC

---

*Revisere: "to look again, examine carefully"*