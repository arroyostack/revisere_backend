# ContractLens Backend

NestJS backend for uploading, parsing, analyzing, and comparing contract documents with configurable AI providers.

## Overview

This backend exposes two main workflows:

- analyze a single contract and return structured extraction, risk analysis, and a plain-English summary
- compare two contract versions and return the important differences in structured form

The project is organized by feature modules and keeps the responsibilities fairly clear:

- controllers handle HTTP input and response shaping
- services handle parsing and AI-driven business workflows
- shared configuration and provider selection live in centralized infrastructure-style modules
- global validation and error handling are configured at application bootstrap

## Getting Started

```bash
npm install
cp .env.example .env
npm run start:dev
```

The API runs on `http://localhost:3000` by default.

## Available Scripts

- `npm run build` - compile the backend into `dist`
- `npm run start` - start the application
- `npm run start:dev` - start the application in watch mode
- `npm run dev` - alias for development mode
- `npm run start:prod` - run the compiled output from `dist`
- `npm run test` - build the project and run the small automated test suite

## API Endpoints

### `POST /contract-analysis/analyze`

Accepts one uploaded contract file and returns:

- extracted structured contract data
- risk analysis
- plain-English summary

Supported file types:

- PDF
- DOCX

### `POST /contract-comparison/compare`

Accepts two uploaded contract files and returns a structured comparison of the changes between them.

## Configuration

Environment variables:

- `PORT` - server port, defaults to `3000`
- `FRONTEND_ORIGIN` - allowed CORS origin, defaults to `http://localhost:5173`
- `AI_PROVIDER` - one of `openai`, `anthropic`, `groq`, `google`, or `minimax`
- `AI_API_KEY` - API key for the selected provider
- `AI_MODEL_IDENTIFIER` - optional explicit model override for the selected provider

## Supported AI Providers

- OpenAI - default model `gpt-4o`
- Anthropic - default model `claude-sonnet-4-20250514`
- Groq - default model `llama-3.3-70b-versatile`
- Google Gemini - default model `gemini-1.5-pro`
- MiniMax - default model `MiniMax-M2.7`

## Testing

The project includes a small automated test suite focused on stable shared behavior:

- AI configuration resolution
- contract file validation rules
- document parsing guard behavior

These tests are intentionally lightweight and meant to improve confidence without changing application behavior.
