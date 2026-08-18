import Link from 'next/link';
import type { IntelligenceReport } from '@/lib/report-types';
import { BRAND_CATEGORY_TIERS } from '@/lib/report-derived';
import { na, pct } from '@/lib/report-utils';
import { SovBars } from './charts';
import { Callout, DataTable, EmptyState, Kpi, Metric, Pill, Section } from './primitives';

const DISCLAIMER =
  'BuddyScore is a proprietary BuddyAds.ai measurement based on observable AI responses and website signals. It is not an internal ranking score provided by OpenAI, Google, Anthropic, Perplexity, or any other AI provider.';

export function ReportSections({ report }: { report: IntelligenceReport }) {
  const cov = report.coverage;
  const mb = report.mentionBreakdown;
  const topActions = report.howToDoBetter.slice(0, 3);

  return (
    <>
      <Section
        id="how-to-read"
        number="02"
        title="How to read this report"
        lede="What the numbers mean before you read the findings."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ReadRule
            title="BuddyScore (0–100)"
            body="A BuddyAds composite of mention rate, position, citations, and on-site AI-readiness. Not an official ranking from any AI provider."
          />
          <ReadRule
            title="LLMs checked"
            body={`Distinct AI assistants queried in this run${cov.platformNames.length ? `: ${cov.platformNames.join(', ')}` : '.'}`}
          />
          <ReadRule
            title="Queries transacted"
            body={`Buyer-style prompts sent across platforms. This run: ${na(cov.queriesTransacted)} queries, ${na(cov.responsesAnalyzed)} successful answers.`}
          />
          <ReadRule
            title="Mention vs link"
            body="Mention = the model named your brand. Link = it cited your website. This report separates named-but-not-linked from named-and-linked."
          />
          <ReadRule
            title="Brand category"
            body="Where you sit: Category leader, Known alternative, Occasional mention, Low visibility, or Invisible — based on mention rate, score, and citations."
          />
          <ReadRule
            title="Strategy by LLM"
            body="One-line read per assistant. Full playbooks are on a strategy call — not in this report."
          />
        </div>
      </Section>

      <Section
        id="executive-summary"
        number="03"
        title="Executive summary"
        lede="Where you stand in AI answers today."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ExecCard q="Where are we?" a={report.executiveSummary.where || report.summary} />
          <ExecCard q="How visible are we?" a={report.executiveSummary.visibility || 'N/A'} />
          <ExecList q="Doing well" items={report.executiveSummary.strengths} />
          <ExecList q="Hurting visibility" items={report.executiveSummary.gaps} />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[#5c616b]">{report.finalTakeaway}</p>
      </Section>

      <Section
        id="brand-category"
        number="04"
        title="Your brand falls in this category"
        lede={report.brandCategory.summary}
      >
        <p className="font-serif text-3xl text-[#0b1220] md:text-4xl">{report.brandCategory.tier}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {BRAND_CATEGORY_TIERS.map((tier) => (
            <span
              key={tier}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                tier === report.brandCategory.tier
                  ? 'border-[#c4a574] bg-[#0b1220] text-[#f4f1ea]'
                  : 'border-[#e4dfd4] bg-white text-[#8b8680]'
              }`}
            >
              {tier}
              {tier === report.brandCategory.tier ? ' · you' : ''}
            </span>
          ))}
        </div>
      </Section>

      <Section
        id="doing-well-bad"
        number="05"
        title="What you are doing well, badly, and not at all"
        lede="Directly under the executive summary — tied to observed evidence."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <TriColumn
            title="Doing well"
            tone="good"
            items={report.strengths.slice(0, 3).map((s) => ({
              title: s.title,
              metric: s.metric,
              body: s.evidence,
            }))}
            empty="No strengths could be evidenced in this sample."
          />
          <TriColumn
            title="Doing poorly"
            tone="bad"
            items={report.gaps.slice(0, 3).map((g) => ({
              title: g.title,
              metric: g.metric,
              body: g.evidence,
            }))}
            empty="No material visibility gaps in this sample."
          />
          <TriColumn
            title="Not doing"
            tone="muted"
            items={report.missingSignals.slice(0, 3).map((m) => ({
              title: m.signal,
              metric: 'Missing',
              body: m.recommendation,
            }))}
            empty="No missing on-site signals flagged."
          />
        </div>
      </Section>

      <Section
        id="llm-performance"
        number="06"
        title="LLM performance"
        lede={`${na(cov.platformsTested)} LLMs checked · ${na(cov.queriesTransacted)} queries transacted · ${na(cov.responsesAnalyzed)} responses analyzed`}
      >
        {report.platformPerformance.length ? (
          <DataTable
            columns={['LLM', 'Queries', 'Mentions', 'Mention %', 'Avg pos.', 'Citations', 'Visibility']}
            rows={report.platformPerformance.map((p) => [
              p.platform,
              String(p.queries),
              String(p.mentions),
              pct(p.mentionRate),
              na(p.avgPosition),
              String(p.citations),
              na(p.visibility),
            ])}
          />
        ) : (
          <EmptyState>No successful platform samples in this run.</EmptyState>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {report.strongestPlatform && (
            <Callout label={`Best — ${report.strongestPlatform.platform}`}>
              <p>{report.strongestPlatform.evidence}</p>
              <p className="mt-2 text-[#5c616b]">{report.strongestPlatform.interpretation}</p>
            </Callout>
          )}
          {report.weakestPlatform && (
            <Callout label={`Worst — ${report.weakestPlatform.platform}`}>
              <p>{report.weakestPlatform.evidence}</p>
              <p className="mt-2 text-[#5c616b]">{report.weakestPlatform.interpretation}</p>
            </Callout>
          )}
        </div>
      </Section>

      <Section
        id="mention-breakdown"
        number="07"
        title="Mention vs link"
        lede="How AI talked about your brand — named only, named with your link, or not at all."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi
            label="Brand mentioned, no link"
            value={<Metric value={mb.mentionedNoLink} />}
            hint={pct(mb.mentionedNoLinkRate)}
          />
          <Kpi
            label="Brand mentioned + your link"
            value={<Metric value={mb.mentionedWithLink} />}
            hint={pct(mb.mentionedWithLinkRate)}
          />
          <Kpi
            label="No brand mention"
            value={<Metric value={mb.noMention} />}
            hint={pct(mb.noMentionRate)}
          />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[#5c616b]">
          Most visibility is name-only unless your domain is cited. Mentions without links do not send traffic or
          reinforce authority in AI answers.
        </p>
      </Section>

      <Section id="competition" number="08" title="Competition" lede={report.competitorInsights || 'Who AI recommends instead of you.'}>
        {report.shareOfVoice.length ? (
          <>
            <SovBars rows={report.shareOfVoice} />
            <div className="mt-8 space-y-4">
              {report.competitorGaps.slice(0, 4).map((g) => (
                <div key={g.area} className="rounded-2xl border border-[#e4dfd4] bg-white p-4">
                  <p className="font-semibold">{g.area}</p>
                  <p className="mt-1 text-sm text-[#5c616b]">
                    You: {g.yours} · {g.competitorName}: {g.competitor}
                  </p>
                  <p className="mt-2 text-sm">{g.gap}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState>No competitor share-of-voice data in this sample.</EmptyState>
        )}
      </Section>

      <Section
        id="how-to-better"
        number="09"
        title="Explore how to do it better"
        lede="Top priorities from this analysis. Full playbooks are on a strategy call."
      >
        {topActions.length ? (
          <ol className="space-y-4">
            {topActions.map((h, i) => (
              <li key={h.problem} className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#b08950]">
                  Priority {i + 1} · {h.priority}
                </p>
                <p className="mt-1 font-semibold">{h.problem}</p>
                <p className="mt-2 text-sm text-[#5c616b]">{h.recommendedAction}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState>Re-run analysis with configured AI platforms for actionable recommendations.</EmptyState>
        )}
      </Section>

      <Section
        id="llm-strategy"
        number="10"
        title="Strategy by LLM"
        lede="One read per assistant. Connect with us for the full roadmap."
      >
        {report.llmStrategies.length ? (
          <div className="space-y-3">
            {report.llmStrategies.map((s) => (
              <div
                key={s.platform}
                className="flex flex-col gap-2 rounded-2xl border border-[#e4dfd4] bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{s.platform}</p>
                  <Pill>{s.tag}</Pill>
                </div>
                <p className="max-w-xl text-sm text-[#5c616b]">{s.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No per-LLM strategy until platforms return successful answers.</EmptyState>
        )}

        <div className="mt-10 rounded-[1.5rem] bg-[#0b1220] p-8 text-[#f4f1ea]">
          <h3 className="font-serif text-2xl">Want the full strategy?</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c5c8d0]">
            This report shows where you stand. A strategy call covers the how: exact pages to ship, prompts to
            re-test, citation targets per LLM, and a plan built for your category.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-full bg-[#c4a574] px-6 text-sm font-semibold text-[#0b1220]"
            >
              Book a strategy call
            </Link>
            <a
              href="mailto:rohit@buddyads.agency"
              className="inline-flex h-11 items-center rounded-full border border-white/20 px-6 text-sm font-semibold"
            >
              rohit@buddyads.agency
            </a>
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-[#8b8680]">{DISCLAIMER}</p>
      </Section>
    </>
  );
}

function ReadRule({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#e4dfd4] bg-white p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#5c616b]">{body}</p>
    </div>
  );
}

function ExecCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#b08950]">{q}</p>
      <p className="mt-2 text-sm leading-relaxed">{a}</p>
    </div>
  );
}

function ExecList({ q, items }: { q: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#b08950]">{q}</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {(items.length ? items : ['N/A']).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[#b08950]">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TriColumn({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: 'good' | 'bad' | 'muted';
  items: { title: string; metric: string; body: string }[];
  empty: string;
}) {
  const border =
    tone === 'good' ? 'border-emerald-200' : tone === 'bad' ? 'border-rose-200' : 'border-[#e4dfd4]';
  const head =
    tone === 'good' ? 'bg-emerald-700' : tone === 'bad' ? 'bg-rose-800' : 'bg-[#5c616b]';
  return (
    <div className={`overflow-hidden rounded-2xl border ${border}`}>
      <p className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-white ${head}`}>{title}</p>
      <div className="space-y-4 bg-white p-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.title}>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs font-semibold text-[#b08950]">{item.metric}</p>
              <p className="mt-1 text-sm text-[#5c616b]">{item.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#8b8680]">{empty}</p>
        )}
      </div>
    </div>
  );
}
