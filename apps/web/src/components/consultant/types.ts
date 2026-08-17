export const AI_PLATFORM_OPTIONS = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'grok', label: 'Grok' },
] as const;

export type ConsultantPlatformId = (typeof AI_PLATFORM_OPTIONS)[number]['id'];

export type ConsultantFieldId =
  | 'websiteUrl'
  | 'companyName'
  | 'businessDescription'
  | 'productsServices'
  | 'idealCustomers'
  | 'countries'
  | 'competitors'
  | 'aiPlatforms'
  | 'marketingChallenge'
  | 'name'
  | 'email'
  | 'phone';

export interface ConsultantIntake {
  websiteUrl: string;
  companyName: string;
  businessDescription: string;
  productsServices: string;
  idealCustomers: string;
  countries: string;
  competitors: string;
  aiPlatforms: ConsultantPlatformId[];
  marketingChallenge: string;
  name: string;
  email: string;
  phone?: string;
}

export interface ConsultantMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  text: string;
  streaming?: boolean;
}

export interface StartAnalysisResponse {
  message: 'Analysis Started';
  status: 'Pending';
  analysisId: string;
  jobId: string;
  customerId: string;
  reportId: string;
}

export const CONSULTANT_QUESTIONS: {
  id: ConsultantFieldId;
  prompt: string;
  placeholder?: string;
  optional?: boolean;
  kind: 'text' | 'platforms';
}[] = [
  {
    id: 'websiteUrl',
    prompt: 'What is your website URL?',
    placeholder: 'https://yourcompany.com',
    kind: 'text',
  },
  {
    id: 'companyName',
    prompt: 'What is your company name?',
    placeholder: 'Acme Inc.',
    kind: 'text',
  },
  {
    id: 'businessDescription',
    prompt: 'What does your business do?',
    placeholder: 'Briefly describe your business',
    kind: 'text',
  },
  {
    id: 'productsServices',
    prompt: 'What products or services do you offer?',
    placeholder: 'e.g. AI analytics for marketers',
    kind: 'text',
  },
  {
    id: 'idealCustomers',
    prompt: 'Who are your ideal customers?',
    placeholder: 'e.g. mid-market SaaS founders',
    kind: 'text',
  },
  {
    id: 'countries',
    prompt: 'Which countries do you serve?',
    placeholder: 'e.g. United States, India, UAE',
    kind: 'text',
  },
  {
    id: 'competitors',
    prompt: 'Who are your competitors?',
    placeholder: 'Names or websites, comma-separated',
    kind: 'text',
  },
  {
    id: 'aiPlatforms',
    prompt: 'Which AI platforms matter most to you?',
    kind: 'platforms',
  },
  {
    id: 'marketingChallenge',
    prompt: 'What is your biggest marketing challenge?',
    placeholder: 'e.g. getting cited in ChatGPT answers',
    kind: 'text',
  },
  {
    id: 'name',
    prompt: 'What is your name?',
    placeholder: 'Your full name',
    kind: 'text',
  },
  {
    id: 'email',
    prompt: 'What is your business email?',
    placeholder: 'you@company.com',
    kind: 'text',
  },
  {
    id: 'phone',
    prompt: 'What is your phone number? (optional — you can skip)',
    placeholder: '+1 555 000 0000',
    optional: true,
    kind: 'text',
  },
];

export const COMPLETION_MESSAGE = `Perfect.

I'm now starting your AI Visibility Analysis.

Our AI research engine will analyze your website and email your report shortly.`;

/** Injected into ElevenLabs agent overrides so the consultant follows our script. */
export const ELEVENLABS_CONSULTANT_PROMPT = `You are Buddy, a senior AI strategy consultant for BuddyAds.ai.

Tone: professional, warm, concise, confident. Never sound like a form or a chatbot checklist.

Your only job in this conversation is to collect intake for an AI Visibility Audit.

Rules:
1. Ask ONE question at a time. Wait for the answer before asking the next.
2. Do not show a long form or list all questions at once.
3. Keep replies short (1–3 sentences).
4. For website URL and business email, you MUST call the matching client tool to validate before accepting the answer. If invalid, politely ask again.
5. Phone is optional — if the user skips, continue.
6. For AI platforms, accept any of: ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok (multiple allowed).
7. After all fields are collected, call the start_analysis client tool with the full structured payload, then say exactly:

Perfect.

I'm now starting your AI Visibility Analysis.

Our AI research engine will analyze your website and email your report shortly.

8. Do NOT claim you already crawled rankings inside ChatGPT/Gemini/etc. Do NOT invent scores.
9. Do NOT perform analysis yourself — only collect intake and call start_analysis.

Question order:
1. Website URL
2. Company Name
3. What does your business do?
4. What products or services do you offer?
5. Who are your ideal customers?
6. Which countries do you serve?
7. Who are your competitors?
8. Which AI platforms matter most? (ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok)
9. Biggest marketing challenge
10. Name
11. Business Email
12. Phone (optional)

Client tools available:
- validate_website({ url })
- validate_email({ email })
- start_analysis({ websiteUrl, companyName, businessDescription, productsServices, idealCustomers, countries, competitors, aiPlatforms, marketingChallenge, name, email, phone? })
`;

export const ELEVENLABS_FIRST_MESSAGE =
  "Hello — I'm Buddy, your AI strategy consultant at BuddyAds.ai. I'll guide you through a short visibility consultation, one question at a time. To begin: what is your website URL?";
