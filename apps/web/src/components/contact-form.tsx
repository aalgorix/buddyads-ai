'use client';

import { useState } from 'react';
import Link from 'next/link';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="pb-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Prefer to jump in?</h2>
          <p className="mt-2 text-muted-foreground">
            Check your AI Visibility Score in minutes. No traditional ad accounts required.
          </p>
          <Link
            href="/check"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-foreground px-8 text-sm font-medium text-background hover:opacity-90"
          >
            Check My AI Visibility
          </Link>
          <div className="mt-10 space-y-4 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Sales</span>
              <br />
              <a href="mailto:rohit@buddyads.agency" className="hover:text-foreground">
                rohit@buddyads.agency
              </a>
            </p>
            <p>
              <span className="font-medium text-foreground">Support</span>
              <br />
              <a href="mailto:rohit@buddyads.agency" className="hover:text-foreground">
                rohit@buddyads.agency
              </a>
            </p>
          </div>
        </div>

        <form
          className="rounded-3xl border border-black/[0.08] bg-[#FAFAFA] p-6 dark:border-white/10 dark:bg-card md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          {submitted ? (
            <p className="py-12 text-center text-lg font-medium" role="status">
              Thanks — we will be in touch shortly.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="mt-1.5 h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm outline-none ring-brand focus:ring-2 dark:border-white/10 dark:bg-background"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1.5 h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm outline-none ring-brand focus:ring-2 dark:border-white/10 dark:bg-background"
                />
              </div>
              <div>
                <label htmlFor="company" className="text-sm font-medium">
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  className="mt-1.5 h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm outline-none ring-brand focus:ring-2 dark:border-white/10 dark:bg-background"
                />
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-medium">
                  What are you looking to achieve?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  placeholder="e.g. Improve ChatGPT and Perplexity citations for our brand"
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none ring-brand focus:ring-2 dark:border-white/10 dark:bg-background"
                />
              </div>
              <button
                type="submit"
                className="h-12 w-full rounded-full bg-foreground text-sm font-medium text-background transition hover:opacity-90"
              >
                Book a Demo
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
