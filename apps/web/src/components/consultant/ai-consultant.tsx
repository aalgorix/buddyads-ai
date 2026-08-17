'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmationScreen } from '@/components/confirmation';
import { ConsultantAvatar, ThinkingDots } from './consultant-avatar';
import { ConsultantMessageBubble } from './consultant-message';
import { assertIntakeReady, submitStartAnalysis } from './start-analysis';
import {
  AI_PLATFORM_OPTIONS,
  COMPLETION_MESSAGE,
  CONSULTANT_QUESTIONS,
  ELEVENLABS_CONSULTANT_PROMPT,
  ELEVENLABS_FIRST_MESSAGE,
  type ConsultantIntake,
  type ConsultantMessage,
  type ConsultantPlatformId,
} from './types';
import {
  isBlankOptional,
  parsePlatforms,
  validateEmail,
  validateWebsiteUrl,
} from './validation';

const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim() || '';

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchSignedUrl(): Promise<string | null> {
  try {
    const res = await fetch('/api/elevenlabs/signed-url');
    if (!res.ok) return null;
    const data = (await res.json()) as { signedUrl?: string };
    return data.signedUrl || null;
  } catch {
    return null;
  }
}

type ShellProps = {
  elevenLabsConnected?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onUserUtterance?: (text: string) => void;
  registerAcceptHandler?: (fn: (text: string) => Promise<void>) => void;
};

function ConsultantExperience({
  elevenLabsConnected,
  isSpeaking,
  isListening,
  voiceEnabled,
  onToggleVoice,
  onUserUtterance,
  registerAcceptHandler,
}: ShellProps) {
  const [messages, setMessages] = useState<ConsultantMessage[]>([
    { id: 'greet', role: 'assistant', text: ELEVENLABS_FIRST_MESSAGE },
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState('');
  const [platforms, setPlatforms] = useState<ConsultantPlatformId[]>([]);
  const [answers, setAnswers] = useState<Partial<ConsultantIntake>>({ aiPlatforms: [] });
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const step = CONSULTANT_QUESTIONS[stepIndex];
  const progress = useMemo(
    () => ((complete ? CONSULTANT_QUESTIONS.length : stepIndex) / CONSULTANT_QUESTIONS.length) * 100,
    [stepIndex, complete],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking, stepIndex, complete]);

  const askNext = useCallback((nextIndex: number) => {
    const next = CONSULTANT_QUESTIONS[nextIndex];
    if (!next) return;
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [...prev, { id: uid('q'), role: 'assistant', text: next.prompt }]);
      setStepIndex(nextIndex);
    }, 650);
  }, []);

  const finish = useCallback(async (finalAnswers: ConsultantIntake) => {
    setSubmitting(true);
    setError(null);
    setThinking(true);
    try {
      const { analysisId: id } = await submitStartAnalysis(finalAnswers);
      setAnalysisId(id);
      setComplete(true);
      setMessages((prev) => [...prev, { id: uid('done'), role: 'assistant', text: COMPLETION_MESSAGE }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setThinking(false);
      setSubmitting(false);
    }
  }, []);

  const acceptAnswer = useCallback(
    async (raw: string, selectedPlatforms?: ConsultantPlatformId[]) => {
      if (!step || complete || submitting) return;
      setError(null);

      let value: string | ConsultantPlatformId[] = raw.trim();

      if (step.id === 'websiteUrl') {
        const result = validateWebsiteUrl(raw);
        if (!result.valid) {
          setError(result.error);
          setMessages((prev) => [
            ...prev,
            { id: uid('u'), role: 'user', text: raw.trim() || '(empty)' },
            { id: uid('a'), role: 'assistant', text: result.error },
          ]);
          return;
        }
        value = result.url;
      }

      if (step.id === 'email') {
        const result = validateEmail(raw);
        if (!result.valid) {
          setError(result.error);
          setMessages((prev) => [
            ...prev,
            { id: uid('u'), role: 'user', text: raw.trim() || '(empty)' },
            { id: uid('a'), role: 'assistant', text: result.error },
          ]);
          return;
        }
        value = result.email;
      }

      if (step.id === 'aiPlatforms') {
        const picked = selectedPlatforms?.length ? selectedPlatforms : parsePlatforms(raw);
        if (!picked.length) {
          const msg =
            'Please choose at least one platform: ChatGPT, Gemini, Claude, Perplexity, Copilot, or Grok.';
          setError(msg);
          setMessages((prev) => [
            ...prev,
            { id: uid('u'), role: 'user', text: raw.trim() || '(none)' },
            { id: uid('a'), role: 'assistant', text: msg },
          ]);
          return;
        }
        value = picked;
      }

      if (step.id === 'phone' && isBlankOptional(raw)) {
        value = '';
      } else if (step.id !== 'aiPlatforms' && step.id !== 'phone' && !String(value).trim()) {
        setError('Please share a short answer so we can continue.');
        return;
      }

      const label =
        step.id === 'aiPlatforms'
          ? (value as ConsultantPlatformId[])
              .map((id) => AI_PLATFORM_OPTIONS.find((p) => p.id === id)?.label || id)
              .join(', ')
          : step.id === 'phone' && !value
            ? 'Skip'
            : String(value);

      setMessages((prev) => [...prev, { id: uid('u'), role: 'user', text: label }]);
      onUserUtterance?.(label);

      const nextAnswers: Partial<ConsultantIntake> = {
        ...answers,
        [step.id]:
          step.id === 'aiPlatforms'
            ? (value as ConsultantPlatformId[])
            : step.id === 'phone'
              ? String(value) || undefined
              : String(value),
      };
      setAnswers(nextAnswers);
      setInput('');
      setPlatforms([]);

      if (stepIndex >= CONSULTANT_QUESTIONS.length - 1) {
        const ready = assertIntakeReady(nextAnswers);
        if ('error' in ready) {
          setError(ready.error);
          setMessages((prev) => [...prev, { id: uid('a'), role: 'assistant', text: ready.error }]);
          return;
        }
        await finish(ready);
        return;
      }

      askNext(stepIndex + 1);
    },
    [answers, askNext, complete, finish, onUserUtterance, step, stepIndex, submitting],
  );

  useEffect(() => {
    registerAcceptHandler?.(acceptAnswer);
  }, [acceptAnswer, registerAcceptHandler]);

  const avatarState = thinking
    ? 'thinking'
    : isSpeaking
      ? 'speaking'
      : isListening
        ? 'listening'
        : 'idle';

  return (
    <div className="relative mx-auto flex min-h-[75vh] w-full max-w-3xl flex-col px-4 pb-8 pt-4 md:px-6">
      <div className="glass mb-4 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 dark:border-white/10 md:px-5">
          <div className="flex items-center gap-3">
            <ConsultantAvatar state={avatarState} />
            <div>
              <p className="text-sm font-semibold tracking-tight">Buddy · AI Consultant</p>
              <p className="text-xs text-muted-foreground">
                {elevenLabsConnected
                  ? 'ElevenLabs Conversational AI connected'
                  : 'AI strategy consultation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onToggleVoice && (
              <button
                type="button"
                onClick={onToggleVoice}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] transition hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/5',
                  voiceEnabled && 'bg-brand/10 text-brand',
                )}
                aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
              >
                {voiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
            )}
            <span className="hidden items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand sm:inline-flex">
              <Sparkles className="h-3 w-3" />
              Live consult
            </span>
          </div>
        </div>

        <div className="h-1 w-full bg-black/[0.04] dark:bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6C63FF] to-[#3B82F6]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <div className="flex max-h-[min(58vh,560px)] min-h-[320px] flex-col gap-4 overflow-y-auto px-4 py-5 md:px-5">
          {messages.map((message, index) => (
            <ConsultantMessageBubble
              key={message.id}
              message={message}
              showAvatar={
                message.role === 'assistant' &&
                (index === 0 || messages[index - 1]?.role !== 'assistant')
              }
            />
          ))}
          <AnimatePresence>{thinking && <ThinkingDots />}</AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {!complete && step && (
          <div className="border-t border-black/[0.06] px-4 py-4 dark:border-white/10 md:px-5">
            {step.kind === 'platforms' && (
              <div className="mb-3 flex flex-wrap gap-2">
                {AI_PLATFORM_OPTIONS.map((opt) => {
                  const active = platforms.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setPlatforms((prev) =>
                          active ? prev.filter((p) => p !== opt.id) : [...prev, opt.id],
                        )
                      }
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        active
                          ? 'border-brand bg-brand/15 text-brand'
                          : 'border-black/[0.08] text-muted-foreground hover:border-brand/40 dark:border-white/10',
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (step.kind === 'platforms') {
                  void acceptAnswer(
                    platforms
                      .map((id) => AI_PLATFORM_OPTIONS.find((p) => p.id === id)?.label || id)
                      .join(', '),
                    platforms,
                  );
                } else {
                  void acceptAnswer(input);
                }
              }}
            >
              <div className="glass flex-1 rounded-2xl px-3 py-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                  placeholder={
                    step.kind === 'platforms'
                      ? 'Select platforms above, or type them here'
                      : step.placeholder
                  }
                  className="max-h-28 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || thinking}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background transition hover:opacity-90 disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {step.optional && (
              <button
                type="button"
                className="mt-2 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => void acceptAnswer('skip')}
              >
                Skip phone
              </button>
            )}
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        )}

        {complete && analysisId && <ConfirmationScreen jobId={analysisId} />}

        {complete && !analysisId && (
          <div className="border-t border-black/[0.06] px-4 py-4 text-sm text-muted-foreground dark:border-white/10 md:px-5">
            Analysis request queued. You can close this window — we will email your report when ready.
          </div>
        )}
      </div>
    </div>
  );
}

function ElevenLabsLiveConsultant() {
  const intakeRef = useRef<Partial<ConsultantIntake>>({ aiPlatforms: [] });
  const acceptRef = useRef<((text: string) => Promise<void>) | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const startedRef = useRef(false);

  const conversation = useConversation({
    textOnly: !voiceEnabled,
    overrides: {
      agent: {
        prompt: { prompt: ELEVENLABS_CONSULTANT_PROMPT },
        firstMessage: ELEVENLABS_FIRST_MESSAGE,
        language: 'en',
      },
    },
    clientTools: {
      validate_website: async (params: { url?: string }) => {
        const result = validateWebsiteUrl(String(params?.url || ''));
        if (!result.valid) return JSON.stringify({ valid: false, error: result.error });
        intakeRef.current.websiteUrl = result.url;
        return JSON.stringify({ valid: true, url: result.url });
      },
      validate_email: async (params: { email?: string }) => {
        const result = validateEmail(String(params?.email || ''));
        if (!result.valid) return JSON.stringify({ valid: false, error: result.error });
        intakeRef.current.email = result.email;
        return JSON.stringify({ valid: true, email: result.email });
      },
      start_analysis: async (params: Record<string, unknown>) => {
        const platformsRaw = params.aiPlatforms;
        const platforms = Array.isArray(platformsRaw)
          ? parsePlatforms(platformsRaw.map(String))
          : parsePlatforms(String(platformsRaw || ''));

        const merged: Partial<ConsultantIntake> = {
          ...intakeRef.current,
          websiteUrl: String(params.websiteUrl || intakeRef.current.websiteUrl || ''),
          companyName: String(params.companyName || intakeRef.current.companyName || ''),
          businessDescription: String(
            params.businessDescription || intakeRef.current.businessDescription || '',
          ),
          productsServices: String(
            params.productsServices || intakeRef.current.productsServices || '',
          ),
          idealCustomers: String(params.idealCustomers || intakeRef.current.idealCustomers || ''),
          countries: String(params.countries || intakeRef.current.countries || ''),
          competitors: String(params.competitors || intakeRef.current.competitors || ''),
          aiPlatforms: platforms.length ? platforms : intakeRef.current.aiPlatforms,
          marketingChallenge: String(
            params.marketingChallenge || intakeRef.current.marketingChallenge || '',
          ),
          name: String(params.name || intakeRef.current.name || ''),
          email: String(params.email || intakeRef.current.email || ''),
          phone: params.phone ? String(params.phone) : intakeRef.current.phone,
        };

        const ready = assertIntakeReady(merged);
        if ('error' in ready) {
          return JSON.stringify({ ok: false, error: ready.error });
        }
        try {
          const { analysisId } = await submitStartAnalysis(ready);
          return JSON.stringify({ ok: true, analysisId });
        } catch (err) {
          return JSON.stringify({
            ok: false,
            error: err instanceof Error ? err.message : 'Failed to start analysis',
          });
        }
      },
    },
    onMessage: (message) => {
      if (message.source === 'user' && message.message?.trim()) {
        void acceptRef.current?.(message.message.trim());
      }
    },
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let active = true;
    (async () => {
      try {
        const signedUrl = await fetchSignedUrl();
        if (!active) return;
        if (signedUrl) {
          await conversation.startSession({ signedUrl });
        } else {
          await conversation.startSession({ agentId });
        }
      } catch (err) {
        console.error('[elevenlabs] startSession failed', err);
      }
    })();
    return () => {
      active = false;
      void conversation.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConsultantExperience
      elevenLabsConnected={conversation.status === 'connected'}
      isSpeaking={conversation.isSpeaking}
      isListening={conversation.isListening}
      voiceEnabled={voiceEnabled}
      onToggleVoice={() => {
        setVoiceEnabled((prev) => {
          const next = !prev;
          if (next) {
            void navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => undefined);
          }
          return next;
        });
      }}
      registerAcceptHandler={(fn) => {
        acceptRef.current = fn;
      }}
      onUserUtterance={(text) => {
        if (conversation.status !== 'connected') return;
        try {
          conversation.sendContextualUpdate(
            `User answered the current intake question with: ${text}`,
          );
        } catch {
          // Session may not support contextual updates in text-only mode.
        }
      }}
    />
  );
}

/**
 * Guided AI consultant for /check — one question at a time.
 * Optional ElevenLabs voice when NEXT_PUBLIC_ELEVENLABS_AGENT_ID is set.
 */
export function AiConsultant() {
  if (!agentId) {
    return <ConsultantExperience />;
  }

  return (
    <ConversationProvider agentId={agentId}>
      <ElevenLabsLiveConsultant />
    </ConversationProvider>
  );
}