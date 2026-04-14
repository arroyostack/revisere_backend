# ContractLens Backend

AI-powered legal contract analysis API built with NestJS.

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### POST /contract-analysis/analyze
Analyze a single contract file (PDF or DOCX).

### POST /contract-comparison/compare
Compare two contract files and identify differences.

## Configuration

- `PORT` - Server port (default: 3000)
- `FRONTEND_ORIGIN` - CORS allowed origin (default: http://localhost:5173)

## Supported AI Providers

- OpenAI (gpt-4o)
- Anthropic (Claude Sonnet 4)
- Groq (llama-3.3-70b-versatile)
- Google Gemini (gemini-1.5-pro)
- MiniMax (abab6.5s-chat)
