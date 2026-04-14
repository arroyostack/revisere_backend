export const SUPPORTED_AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GROQ: 'groq',
  GOOGLE: 'google',
  MINIMAX: 'minimax',
} as const;

export type SupportedAiProvider = typeof SUPPORTED_AI_PROVIDERS[keyof typeof SUPPORTED_AI_PROVIDERS];

export const DEFAULT_MODELS: Record<SupportedAiProvider, string> = {
  [SUPPORTED_AI_PROVIDERS.OPENAI]: 'gpt-4o',
  [SUPPORTED_AI_PROVIDERS.ANTHROPIC]: 'claude-sonnet-4-20250514',
  [SUPPORTED_AI_PROVIDERS.GROQ]: 'llama-3.3-70b-versatile',
  [SUPPORTED_AI_PROVIDERS.GOOGLE]: 'gemini-1.5-pro',
  [SUPPORTED_AI_PROVIDERS.MINIMAX]: 'abab6.5s-chat',
};

export const PROVIDER_DISPLAY_NAMES: Record<SupportedAiProvider, string> = {
  [SUPPORTED_AI_PROVIDERS.OPENAI]: 'OpenAI',
  [SUPPORTED_AI_PROVIDERS.ANTHROPIC]: 'Anthropic (Claude)',
  [SUPPORTED_AI_PROVIDERS.GROQ]: 'Groq',
  [SUPPORTED_AI_PROVIDERS.GOOGLE]: 'Google Gemini',
  [SUPPORTED_AI_PROVIDERS.MINIMAX]: 'MiniMax',
};
