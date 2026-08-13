import type { IntelligenceReport } from '@/lib/report-types';
import { formatDate, na, pct } from '@/lib/report-utils';
import { CoNetwork, EntityMap, ScoreRing, SovBars } from './charts';
import {
  Callout,
  DataTable,
  EmptyState,
  Evidence,
  Info,
  Kpi,
  Metric,
  Pill,
  ScoreBar,
  Section,
} from './primitives';

const DISCLAIMER =
  'BuddyScore is a proprietary BuddyAds.ai measurement based on observable AI responses and website signals. It is not an internal ranking score provided by OpenAI, Google, Anthropic, Perplexity, or any other AI provider.';

export function ReportSections({ report }: { report: IntelligenceReport }) {
  const s = report.scores;
  const cov = report.coverage;
  const tested = cov.platformNames;

  return (
    <>
      <Section
        id="executive-summary"
        number="02"
        eyebrow="For the CEO / CMO"
        title="Executive summary"
        lede="One page. Five questions. Nothing that requires reading the rest of the report — unless you want the evidence."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ExecCard q="Where are we?" a={report.executiveSummary.where || report.summary} />
          <ExecCard q="How visible are we?" a={report.executiveSummary.visibility || 'N/A'} />
          <ExecList q="What are we doing well?" items={report.executiveSummary.strengths} />
          <ExecList q="What is hurting us?" items={report.executiveSummary.gaps} />
        </div>
        <div className="mt-4">
          <ExecList q="What should we do next?" items={report.executiveSummary.next} wide />
        </div>
      </Section>

      <Section
        id="how-to-read"
        number="03"
        title="How to read your AI Visibility Report"
        lede="This is not a traditional SEO audit. It is a measurement of how answer engines talk about you — and what is missing from that picture."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Step n="01" t="We ask AI" d="We generate realistic questions that potential customers may ask AI assistants about your industry, products, services, and competitors." />
          <Step
            n="02"
            t="We test multiple AI platforms"
            d={
              tested.length
                ? `This run queried ${tested.length} platform${tested.length === 1 ? '' : 's'}: ${tested.join(', ')}. Only platforms that were actually sent prompts appear in this report.`
                : 'No AI platforms returned successful samples in this run. Platform comparisons are N/A.'
            }
          />
          <Step n="03" t="We analyze the answers" d="We measure brand mentions, brand position, competitor mentions, citations, sources, sentiment, and coverage by platform — only where the answer contains that evidence." />
          <Step n="04" t="We identify opportunities" d="Technical, AEO, GEO, entity, content, and citation signals are combined with the live answers to calculate BuddyScore and an action plan. Interpretation is labeled separately from observed data." />
        </div>
      </Section>

      <Section id="coverage" number="04" title="Your AI Visibility research coverage">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="AI Platforms Tested" value={<Metric value={cov.platformsTested || null} />} hint="Distinct platforms that received at least one prompt." />
          <Kpi label="AI Models Tested" value={<Metric value={cov.modelsTested || null} />} hint="Distinct model IDs actually called." />
          <Kpi label="Queries Transacted" value={<Metric value={cov.queriesTransacted || null} />} hint="Unique prompts sent across platforms." />
          <Kpi label="AI Responses Analyzed" value={<Metric value={cov.responsesAnalyzed || null} />} hint="Successful answers only. Failed calls are excluded." />
          <Kpi label="Brands Tracked" value={<Metric value={cov.brandsTracked || null} />} hint="Your brand plus intake competitors plus brands observed in answers." />
          <Kpi label="Citations Collected" value={<Metric value={cov.citationsCollected || null} />} hint="URLs extracted from model answers. Invented links are not added." />
          <Kpi
            label="Research Period"
            value={
              <span className="font-serif text-xl md:text-2xl">
                {cov.researchStartedAt ? formatDate(cov.researchStartedAt) : formatDate(report.generatedAt)}
              </span>
            }
            hint="Timestamp of this analysis snapshot."
          />
          <Kpi label="Confidence" value={report.confidence} hint={report.confidenceReason} />
        </div>
        {cov.modelNames.length > 0 && (
          <p className="mt-6 text-xs text-[#8b8680]">Models: {cov.modelNames.join(' · ')}</p>
        )}
      </Section>

      <Section
        id="overview"
        number="05"
        title="Your AI visibility at a glance"
        lede="BuddyScore is the composite. The other scores are the reasons. They are not meant to look identical."
      >
        <div className="grid items-center gap-8 lg:grid-cols-[200px_1fr]">
          <div className="flex justify-center">
            <ScoreRing value={s.buddyScore} />
          </div>
          <div className="space-y-4">
            <ScoreBar label="BuddyScore" value={s.buddyScore} dominate />
            <div className="grid gap-3 sm:grid-cols-2">
              <ScoreBar label="AI Visibility" value={s.aiVisibility} />
              <ScoreBar label="AEO" value={s.aeo} />
              <ScoreBar label="GEO" value={s.geo} />
              <ScoreBar label="Technical" value={s.technical} />
              <ScoreBar label="Entity Strength" value={s.entityStrength} />
              <ScoreBar label="Citation Strength" value={s.citationStrength} />
              <ScoreBar label="Brand Consistency" value={s.brandConsistency} />
              <ScoreBar label="Competitor Advantage" value={s.competitorAdvantage} />
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="platforms"
        number="06"
        title="How does each AI platform see your brand?"
        lede="Only platforms that were actually queried are listed. Absence from this table means that platform was not tested."
      >
        <DataTable
          columns={['AI Platform', 'Model', 'Queries', 'Mentions', 'Mention Rate', 'Avg Position', 'Citations', 'Visibility']}
          rows={report.platformPerformance.map((p) => [
            p.platform,
            p.model,
            p.queries,
            p.mentions,
            pct(p.mentionRate),
            na(p.avgPosition),
            p.citations,
            na(p.visibility),
          ])}
          empty="Insufficient data — no successful platform samples."
        />
      </Section>

      <Section id="best-worst" number="07" title="Best and worst performing AI">
        <div className="grid gap-4 lg:grid-cols-2">
          {report.strongestPlatform ? (
            <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-6">
              <Pill tone="good">Best performing</Pill>
              <h3 className="mt-4 font-serif text-3xl">{report.strongestPlatform.platform}</h3>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Stat k="Visibility" v={na(report.strongestPlatform.visibility)} />
                <Stat k="Mention rate" v={pct(report.strongestPlatform.mentionRate)} />
                <Stat k="Average position" v={na(report.strongestPlatform.avgPosition)} />
                <Stat k="Citation rate" v={pct(report.strongestPlatform.citationRate)} />
              </dl>
              <Evidence>{report.strongestPlatform.evidence}</Evidence>
              <p className="mt-3 text-sm leading-relaxed text-[#3d4148]">
                <span className="font-semibold">BuddyAds interpretation. </span>
                {report.strongestPlatform.interpretation}
              </p>
            </div>
          ) : (
            <EmptyState>Insufficient data to name a strongest platform.</EmptyState>
          )}
          {report.weakestPlatform ? (
            <div className="rounded-3xl border border-rose-200/80 bg-rose-50/40 p-6">
              <Pill tone="bad">Needs attention</Pill>
              <h3 className="mt-4 font-serif text-3xl">{report.weakestPlatform.platform}</h3>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Stat k="Visibility" v={na(report.weakestPlatform.visibility)} />
                <Stat k="Mention rate" v={pct(report.weakestPlatform.mentionRate)} />
                <Stat k="Average position" v={na(report.weakestPlatform.avgPosition)} />
                <Stat k="Citation rate" v={pct(report.weakestPlatform.citationRate)} />
              </dl>
              <Evidence>{report.weakestPlatform.evidence}</Evidence>
              <p className="mt-3 text-sm leading-relaxed text-[#3d4148]">
                <span className="font-semibold">BuddyAds interpretation. </span>
                {report.weakestPlatform.interpretation}
              </p>
            </div>
          ) : (
            <EmptyState>Not enough platforms to compare a weakest performer.</EmptyState>
          )}
        </div>
      </Section>

      <Section
        id="strengths"
        number="08"
        title="What your company is doing well"
        lede="Only strengths we can evidence from this sample. If a card is missing, we did not invent one."
      >
        {report.strengths.length === 0 ? (
          <EmptyState>No evidenced strengths from this sample beyond the raw crawl. That is itself a finding.</EmptyState>
        ) : (
          <div className="space-y-4">
            {report.strengths.map((item, i) => (
              <article key={item.id} className="rounded-2xl border border-[#e4dfd4] bg-white p-5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b08950]">
                  {String(i + 1).padStart(2, '0')} — {item.metric}
                </p>
                <h3 className="mt-2 font-serif text-2xl">{item.title}</h3>
                <Evidence>{item.evidence}</Evidence>
                <p className="mt-2 text-sm text-[#3d4148]">
                  <span className="font-semibold">Business impact. </span>
                  {item.impact}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="gaps"
        number="09"
        title="Where your AI visibility is weak"
        lede="Visibility gaps — not a verdict on the quality of the company. These are the places assistants currently cannot, or do not, include you."
      >
        {report.gaps.length === 0 ? (
          <EmptyState>No evidenced visibility gaps in this sample.</EmptyState>
        ) : (
          <div className="space-y-4">
            {report.gaps.map((g) => (
              <article key={g.id} className="grid gap-4 rounded-2xl border border-[#e4dfd4] bg-white p-5 md:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-serif text-2xl">{g.title}</h3>
                  <Evidence>{g.evidence}</Evidence>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                  <Pill tone={g.severity === 'High' ? 'bad' : g.severity === 'Low' ? 'good' : 'warn'}>
                    Impact {g.impact || g.severity || 'N/A'}
                  </Pill>
                  <span className="text-xs text-[#8b8680]">{g.area || '—'}</span>
                  <span className="text-xs font-semibold">{g.metric}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="missing"
        number="10"
        title="What AI cannot find about you"
        lede="Important things your company should be doing that this crawl did not observe. These are missing signals, not accusations."
      >
        {report.missingSignals.length === 0 ? (
          <EmptyState>No missing on-site signals were flagged from the crawled page.</EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {report.missingSignals.map((m) => (
              <article key={m.signal} className="rounded-2xl border border-dashed border-[#d9c7a2] bg-[#fbf6ec] p-5">
                <h3 className="font-semibold">{m.signal}</h3>
                <p className="mt-2 text-sm text-[#5c616b]">{m.observed}</p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Why it matters. </span>
                  {m.whyItMatters}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Do this. </span>
                  {m.recommendation}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="competition"
        number="11"
        title="Your AI competition"
        lede="Who AI recommends instead of you, who appears most often, and which platforms favor them."
      >
        <Callout label="Observed in this sample">{report.competitorInsights || 'Insufficient competitor evidence.'}</Callout>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-serif text-2xl">AI share of voice</h3>
            <p className="mt-1 text-sm text-[#8b8680]">Mention share among successful responses.</p>
            <div className="mt-6">
              {report.shareOfVoice.length ? <SovBars rows={report.shareOfVoice} /> : <EmptyState>Insufficient data.</EmptyState>}
            </div>
          </div>
          <div>
            <h3 className="font-serif text-2xl">Who appears alongside your brand?</h3>
            <div className="mt-4">
              <CoNetwork brand={report.brandName} links={report.coOccurrence} />
            </div>
          </div>
        </div>
        <div className="mt-8">
          <DataTable
            columns={['Brand', 'Mentions', 'Mention rate', 'Cited responses', 'Platforms that named them']}
            rows={report.competitors.map((c) => [
              c.name,
              c.mentions,
              pct(c.mentionRate),
              c.citations,
              c.platforms.join(', ') || 'N/A',
            ])}
            empty="No competitors were observed in sampled answers."
          />
        </div>
      </Section>

      <Section
        id="competitor-gaps"
        number="12"
        title="Where competitors are winning"
        lede="Gaps are computed only where we have a number for you. Competitor websites were not crawled — their on-site scores are N/A."
      >
        <DataTable
          columns={['Area', 'Your brand', 'Competitor', 'Gap']}
          rows={report.competitorGaps.map((g) => [
            g.area,
            g.yours,
            `${g.competitor} (${g.competitorName})`,
            g.gap,
          ])}
          empty="Insufficient paired competitor data."
        />
      </Section>

      <Section
        id="prompts"
        number="13"
        title="What happens when customers ask AI?"
        lede="Each card is one tested query. Each column is a platform that actually received it."
      >
        {report.promptResults.length === 0 ? (
          <EmptyState>No prompt-level results in this sample.</EmptyState>
        ) : (
          <div className="space-y-8">
            {report.promptResults.map((p) => (
              <article key={p.query} className="rounded-3xl border border-[#e4dfd4] bg-white p-5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08950]">Tested query</p>
                <blockquote className="mt-2 font-serif text-xl leading-snug text-[#14161c]">“{p.query}”</blockquote>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {p.platforms.map((cell) => (
                    <div key={`${cell.platform}-${cell.model}`} className="rounded-2xl border border-[#ece8df] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{cell.platform}</p>
                        {cell.error ? (
                          <Pill>Error</Pill>
                        ) : cell.mentioned ? (
                          <Pill tone="good">Mentioned</Pill>
                        ) : (
                          <Pill tone="bad">Not mentioned</Pill>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-[#8b8680]">{cell.model}</p>
                      <dl className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between gap-2">
                          <dt>Position</dt>
                          <dd>{na(cell.position)}</dd>
                        </div>
                        <div>
                          <dt className="text-[#8b8680]">Competitors</dt>
                          <dd>{cell.competitors.length ? cell.competitors.join(', ') : 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-[#8b8680]">Citations</dt>
                          <dd>{cell.citations.length ? cell.citations.join(', ') : 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-[#8b8680]">Source</dt>
                          <dd>{cell.source || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section id="winning" number="14" title="Where AI already recommends you">
        <DataTable
          columns={['Query', 'AI Platform', 'Position', 'Mention', 'Citation', 'Competitors']}
          rows={report.winningQueries.map((q) => [
            q.query,
            q.platform,
            na(q.position),
            q.mentioned ? 'Yes' : 'No',
            q.cited == null ? 'N/A' : q.cited ? 'Yes' : 'No',
            q.competitors.join(', ') || 'N/A',
          ])}
          empty="No winning queries in this sample — the brand was not named in successful answers."
        />
      </Section>

      <Section
        id="losing"
        number="15"
        title="Where AI chooses someone else"
        lede="Who won, why, what is missing, and the opportunity — only for queries where other brands appeared and you did not."
      >
        {report.losingQueries.length === 0 ? (
          <EmptyState>No losing queries with evidenced competitor wins in this sample.</EmptyState>
        ) : (
          <div className="space-y-4">
            {report.losingQueries.map((q, i) => (
              <article key={`${q.query}-${q.platform}-${i}`} className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
                <p className="font-serif text-lg leading-snug">“{q.query}”</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#8b8680]">{q.platform}</p>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[#8b8680]">Who won?</dt>
                    <dd className="font-medium">{q.whoWon || q.competitors[0] || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#8b8680]">Why?</dt>
                    <dd>{q.why || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#8b8680]">What is missing?</dt>
                    <dd>{q.missing || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#8b8680]">Opportunity</dt>
                    <dd>{q.opportunity || 'N/A'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section id="citations" number="16" title="Which sources influence AI visibility?">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Kpi label="Your domain citation rate" value={pct(report.ownCitationRate)} hint="Share of successful answers that included a URL on your domain." />
          <Kpi label="Distinct domains" value={<Metric value={report.citedDomains.length || null} />} hint="Unique domains extracted from answers." />
          <Kpi label="Citations collected" value={<Metric value={cov.citationsCollected || null} />} hint="Total URL mentions extracted." />
        </div>
        <DataTable
          columns={['Domain', 'Frequency', 'AI platforms', 'Role']}
          rows={report.citedDomains.map((d) => [
            d.domain,
            d.frequency,
            d.platforms.join(', ') || 'N/A',
            d.isOwn ? 'Your domain' : d.isCompetitor ? 'Competitor-related' : 'Third party',
          ])}
          empty="No citation URLs were present in sampled answers."
        />
      </Section>

      <Section
        id="citation-gap"
        number="17"
        title="What sources are competitors getting cited from that you are not?"
        lede="A strategic gap: domains that appear when AI discusses a competitor, but not when it discusses you."
      >
        {report.citationGaps.length === 0 ? (
          <EmptyState>Insufficient citation-gap evidence in this sample.</EmptyState>
        ) : (
          <div className="space-y-4">
            {report.citationGaps.map((g) => (
              <article key={g.competitor} className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
                <h3 className="font-serif text-2xl">{g.competitor}</h3>
                <p className="mt-2 text-sm">
                  <span className="text-[#8b8680]">Cited from: </span>
                  {g.domains.length ? g.domains.join(', ') : 'N/A'}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-[#8b8680]">Your brand cited from: </span>
                  {g.yours.length ? g.yours.join(', ') : 'Company website only / none observed'}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{g.opportunity}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <EngineSection
        id="aeo"
        number="18"
        title="Answer Engine Optimization"
        score={s.aeo}
        rows={report.aeoDetail}
        well={report.crawl.hasFaq ? 'FAQ or question-shaped content is present on the crawled page.' : null}
        missing={!report.crawl.hasFaq ? 'FAQ and direct-answer blocks are the fastest AEO gap to close.' : null}
      />
      <EngineSection
        id="geo"
        number="19"
        title="Generative Engine Optimization"
        score={s.geo}
        rows={report.geoDetail}
        well={report.crawl.hasSchema ? 'Machine-readable entity markup was detected.' : null}
        missing={!report.crawl.hasOrgSchema ? 'Organization / product entities are under-specified for generative engines.' : null}
      />

      <Section
        id="technical"
        number="20"
        title="Can AI easily understand your website?"
        lede="Technical score is about extractability and discovery — not a Lighthouse dump. Each row is a business-relevant signal."
      >
        <div className="mb-6 flex items-end gap-4">
          <p className="font-serif text-6xl">{na(s.technical)}</p>
          <p className="pb-2 text-sm text-[#8b8680]">Technical AI readiness</p>
        </div>
        {report.technicalDetail.length === 0 ? (
          <EmptyState>Technical detail was not stored for this report.</EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {report.technicalDetail.map((row) => (
              <div key={row.label} className="rounded-2xl border border-[#e4dfd4] bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{row.label}</p>
                  <p className="font-serif text-2xl">{na(row.score)}</p>
                </div>
                <p className="mt-2 text-sm text-[#5c616b]">{row.note}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="entity" number="21" title="How AI understands your company">
        <EntityMap
          nodes={[
            { label: 'Company', value: report.entityProfile.company },
            { label: 'Products', value: report.entityProfile.products, missing: !report.entityProfile.products },
            { label: 'Services', value: report.entityProfile.services, missing: !report.entityProfile.services },
            { label: 'Industry', value: report.entityProfile.industry, missing: !report.entityProfile.industry },
            { label: 'Locations', value: report.entityProfile.locations, missing: !report.entityProfile.locations },
            { label: 'Audience', value: report.entityProfile.audience, missing: !report.entityProfile.audience },
            { label: 'Topics', value: report.entityProfile.topics.join(' · ') || null, missing: !report.entityProfile.topics.length },
            { label: 'Competitors', value: report.entityProfile.competitors.join(', ') || null, missing: !report.entityProfile.competitors.length },
            { label: 'Technology / schema', value: report.entityProfile.technology, missing: !report.entityProfile.technology },
          ]}
        />
        {(report.entityProfile.missing.length > 0 || report.entityProfile.inconsistent.length > 0) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {report.entityProfile.missing.length > 0 && (
              <Callout label="Missing entities">{report.entityProfile.missing.join(' · ')}</Callout>
            )}
            {report.entityProfile.inconsistent.length > 0 && (
              <Callout label="Inconsistent signals">{report.entityProfile.inconsistent.join(' ')}</Callout>
            )}
          </div>
        )}
      </Section>

      <Section
        id="perception"
        number="22"
        title="How AI describes your brand"
        lede="Sentiment is inferred only from sentences that mention you. Quotes are observed responses; interpretation is labeled."
      >
        {!report.perception ? (
          <EmptyState>Insufficient sentiment data — the brand was not described often enough to classify.</EmptyState>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Positive" value={report.perception.positive} hint="Answers with recommend-style language about the brand." />
              <Kpi label="Neutral" value={report.perception.neutral} hint="Factual mentions without strong valence." />
              <Kpi label="Negative" value={report.perception.negative} hint="Cautionary or critical language in brand sentences." />
              <Kpi label="Mixed" value={report.perception.mixed} hint="Both recommend-style and cautionary cues in the same answer." />
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08950]">Observed AI responses</p>
                <div className="mt-3 space-y-3">
                  {report.perception.observedQuotes.map((q, i) => (
                    <blockquote key={i} className="rounded-2xl border border-[#e4dfd4] bg-white p-4 text-sm leading-relaxed">
                      “{q.text}”
                      <footer className="mt-2 text-xs text-[#8b8680]">
                        {q.platform} · {q.sentiment}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
              <Callout label="BuddyAds interpretation">{report.perception.interpretation}</Callout>
            </div>
          </>
        )}
      </Section>

      <Section id="opportunities" number="23" title="Your biggest AI visibility opportunities">
        {report.opportunities.length === 0 ? (
          <EmptyState>No evidenced opportunities could be ranked from this sample.</EmptyState>
        ) : (
          <div className="space-y-4">
            {report.opportunities.map((o) => (
              <article key={o.rank} className="rounded-2xl border border-[#e4dfd4] bg-white p-5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b08950]">#{o.rank}</p>
                <h3 className="mt-1 font-serif text-2xl">{o.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone={o.impact === 'High' ? 'bad' : 'warn'}>Impact {o.impact}</Pill>
                  <Pill>Difficulty {o.difficulty}</Pill>
                  <Pill tone="neutral">Confidence {o.confidence}</Pill>
                </div>
                <p className="mt-3 text-sm text-[#5c616b]">
                  AI platforms affected: {o.platforms.length ? o.platforms.join(' + ') : 'N/A'}
                </p>
                <Evidence>{o.evidence}</Evidence>
                <p className="mt-2 text-sm">{o.strategicValue}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        id="how-to"
        number="24"
        title="Explore how you can do it better"
        lede="Problem, why it matters, evidence, action, implementation. Potential impact is directional — never a guaranteed point increase."
      >
        {report.howToDoBetter.length === 0 ? (
          <EmptyState>No action narrative stored for this report.</EmptyState>
        ) : (
          <div className="space-y-6">
            {report.howToDoBetter.map((h) => (
              <article key={h.problem} className="rounded-3xl border border-[#e4dfd4] bg-white p-6">
                <div className="flex flex-wrap gap-2">
                  <Pill tone={h.priority === 'High' ? 'bad' : h.priority === 'Low' ? 'good' : 'warn'}>
                    Priority {h.priority}
                  </Pill>
                  <Pill>Difficulty {h.difficulty}</Pill>
                </div>
                <h3 className="mt-3 font-serif text-2xl">{h.problem}</h3>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-semibold">Why it matters</dt>
                    <dd className="mt-1 text-[#5c616b]">{h.whyItMatters}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Evidence</dt>
                    <dd className="mt-1 text-[#5c616b]">{h.evidence}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Recommended action</dt>
                    <dd className="mt-1">{h.recommendedAction}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Implementation</dt>
                    <dd className="mt-1 text-[#5c616b]">{h.implementation}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm text-[#5c616b]">
                  <span className="font-semibold text-[#14161c]">Expected impact. </span>
                  {h.expectedImpact}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section id="plan-7" number="25" title="What to fix first" lede="A 7-day plan of quick wins, each tied to an observed problem.">
        {report.plan7Day.length === 0 ? (
          <EmptyState>No 7-day plan stored.</EmptyState>
        ) : (
          <ol className="relative space-y-0 border-l border-[#e4dfd4] ml-3">
            {report.plan7Day.map((d) => (
              <li key={d.day} className="relative pb-8 pl-8">
                <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#0b1220] text-[10px] font-bold text-[#f4f1ea]">
                  {d.day}
                </span>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#b08950]">Day {d.day}</p>
                <p className="font-serif text-xl">{d.title}</p>
                <p className="mt-1 text-sm text-[#3d4148]">{d.task}</p>
                <p className="mt-1 text-xs text-[#8b8680]">Connected problem: {d.connectedProblem}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section id="plan-30" number="26" title="Your 30-day AI visibility roadmap">
        {report.roadmap30.length === 0 ? (
          <EmptyState>No 30-day roadmap stored.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {report.roadmap30.map((w) => (
              <article key={w.week} className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#b08950]">
                  Week {w.week} · {w.theme}
                </p>
                <ul className="mt-3 space-y-3 text-sm">
                  {w.tasks.map((t) => (
                    <li key={t.task}>
                      <p>{t.task}</p>
                      <p className="text-xs text-[#8b8680]">{t.connectedProblem}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section id="plan-90" number="27" title="Your 90-day AI visibility strategy" lede="Month 1 Fix · Month 2 Build · Month 3 Expand.">
        {report.strategy90.length === 0 ? (
          <EmptyState>No 90-day strategy stored.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {report.strategy90.map((m) => (
              <article key={m.month} className="rounded-2xl border border-[#e4dfd4] bg-[#0b1220] p-5 text-[#f4f1ea]">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#c4a574]">
                  Month {m.month}
                </p>
                <h3 className="mt-2 font-serif text-3xl">{m.theme}</h3>
                <ul className="mt-4 space-y-2 text-sm text-[#c5c8d0]">
                  {m.tasks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section id="methodology" number="28" title="Report methodology">
        <ul className="space-y-3 text-sm leading-relaxed text-[#3d4148]">
          {report.methodologyNotes.map((n) => (
            <li key={n} className="border-l-2 border-[#c4a574] pl-4">
              {n}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm leading-relaxed text-[#5c616b]">{DISCLAIMER}</p>
      </Section>

      <Section id="confidence" number="29" title="Research confidence">
        <div className="rounded-3xl border border-[#e4dfd4] bg-white p-8">
          <p className="font-serif text-5xl">{report.confidence}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#3d4148]">{report.confidenceReason}</p>
          <p className="mt-4 text-xs text-[#8b8680]">
            Low sample sizes are never hidden. A Low confidence report is still useful for on-site AEO/GEO/technical work.
          </p>
        </div>
      </Section>

      <Section id="takeaway" number="30" title="Final executive takeaway">
        <p className="max-w-3xl font-serif text-2xl leading-snug text-[#14161c] md:text-3xl">
          {report.finalTakeaway || report.summary || 'Insufficient data for a takeaway.'}
        </p>
      </Section>
    </>
  );
}

function ExecCard({ q, a }: { q: string; a: string }) {
  return (
    <article className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08950]">{q}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#3d4148]">{a}</p>
    </article>
  );
}

function ExecList({ q, items, wide }: { q: string; items: string[]; wide?: boolean }) {
  return (
    <article className={`rounded-2xl border border-[#e4dfd4] bg-white p-5 ${wide ? '' : ''}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08950]">{q}</p>
      {items.length ? (
        <ol className="mt-3 space-y-2 text-sm">
          {items.map((x, i) => (
            <li key={x} className="flex gap-3">
              <span className="font-serif text-[#c4a574]">{String(i + 1).padStart(2, '0')}</span>
              <span>{x}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-[#8b8680]">N/A</p>
      )}
    </article>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <article className="rounded-2xl border border-[#e4dfd4] bg-white p-5">
      <p className="font-serif text-3xl text-[#c4a574]">{n}</p>
      <h3 className="mt-2 font-semibold">{t}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5c616b]">{d}</p>
    </article>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-[#8b8680]">{k}</dt>
      <dd className="font-serif text-2xl">{v}</dd>
    </div>
  );
}

function EngineSection({
  id,
  number,
  title,
  score,
  rows,
  well,
  missing,
}: {
  id: string;
  number: string;
  title: string;
  score: number | null;
  rows: IntelligenceReport['aeoDetail'];
  well: string | null;
  missing: string | null;
}) {
  return (
    <Section id={id} number={number} title={title}>
      <div className="mb-6 flex items-end gap-4">
        <p className="font-serif text-6xl">{na(score)}</p>
        <p className="pb-2 text-sm text-[#8b8680]">
          Score
          <Info text="Computed from observable on-page signals in this crawl, not from a third-party ranking API." />
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState>Sub-scores were not stored for this report.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-2xl border border-[#e4dfd4] bg-white p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{row.label}</p>
                <p className="font-serif text-2xl">{na(row.score)}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#8b8680]">{row.note}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout label="What you’re doing well">{well || 'See sub-scores above — only evidenced signals are scored.'}</Callout>
        <Callout label="What you’re missing / what to fix">{missing || 'No single missing AEO/GEO signal dominated this crawl.'}</Callout>
      </div>
    </Section>
  );
}
