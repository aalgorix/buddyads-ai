'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export function VisibilityForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [jobId, setJobId] = useState('');

  const field =
    'h-12 w-full rounded-xl border border-ink/10 bg-white/90 px-4 text-ink outline-none transition placeholder:text-muted/50 focus:border-accent focus:ring-4 focus:ring-accent/10';
  const label = 'text-xs font-semibold uppercase tracking-wider text-muted';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.message || 'Could not start analysis');
        return;
      }
      setStatus('ok');
      setJobId(data.jobId);
      setMessage('Analysis queued. Keep the worker running — we will email your report when ready.');
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <motion.form
      id="audit"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65 }}
      className="mt-10 grid gap-5 md:grid-cols-2"
    >
      <label className="grid gap-2">
        <span className={label}>Your name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </label>
      <label className="grid gap-2">
        <span className={label}>Work email</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </label>
      <label className="grid gap-2">
        <span className={label}>Company</span>
        <input value={company} onChange={(e) => setCompany(e.target.value)} className={field} />
      </label>
      <label className="grid gap-2">
        <span className={label}>Website URL</span>
        <input
          required
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourbrand.com"
          className={field}
        />
      </label>
      <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-gradient inline-flex h-12 items-center rounded-xl px-8 text-sm font-semibold disabled:opacity-60"
        >
          {status === 'loading' ? 'Starting…' : 'Check my AI visibility'}
        </button>
        {message && (
          <p className={`max-w-md text-sm ${status === 'error' ? 'text-rose-600' : 'text-muted'}`}>
            {message}
            {jobId ? ` · Job ${jobId.slice(0, 8)}…` : ''}
          </p>
        )}
      </div>
    </motion.form>
  );
}
