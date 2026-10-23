# tensr

> A dating app where you can match with your favorite large language model.

**tensr** is a playful, mobile-first web app. You build a profile, tell us what you're
into, and swipe through profiles of recently popular LLMs. If the chemistry is mutual,
you match — and the model can chat with you in character.

This repository is at the **planning / pre-alpha** stage. This README is the product
plan; the implementation backlog lives in [Issues](../../issues) and is organized into
the milestones below. The target user, personas, tone, non-goals, and success metrics
live in the [product spec](docs/product-spec.md).

---

## The core loop

1. **Onboard (≈2 min).** Pick a name and avatar, write a short bio, and choose what you
   care about: personality, communication style, interests, modalities, context
   ("how much do they remember?"), openness, cost, and whether open weights matter.
2. **Swipe.** Get a personalized deck of model profiles. Swipe right to like, left to
   pass, up to super-like. Every card explains *why* it was recommended.
3. **Match.** A match happens when the interest is mutual — the model's simulated
   preference profile says you're compatible too. Matches are celebrated and saved.
4. **Chat.** Talk to your matches. Each model replies in its own persona, with streaming
   responses and persistent history.

### Product principles

- **Delight first.** This is a toy with taste: fast, tactile, funny, and shareable.
- **Honest about AI.** Models are clearly labeled as AI. No pretending they are people.
- **Explainable.** "Why this match?" is always one tap away.
- **Private by default.** Profile data is never sent to model providers beyond what a
  chat needs, and users can export or delete everything.
- **Cheap to run.** Cached catalog data, on-demand inference, hard spend caps.

---

## Feature plan

### M0 — Foundations

Everything needed to build confidently: a product spec with success metrics, the app
skeleton, a database schema, a design system, local dev, CI, and the model-catalog data
format with an initial curated dataset.

### M1 — MVP: profile → swipe → match

- Guest sessions plus email magic-link sign-in.
- Multi-step onboarding with a rich but skippable preference survey.
- Editable profile, avatar upload or generated avatar, and privacy controls.
- A catalog of **50+ recently popular models** with dating-profile-style fields
  (personality, loves, quirks, "turn-offs", specs translated into human terms).
- Catalog browsing, search, and a detail page for every model.
- A tactile swipe deck: drag gestures, keyboard shortcuts, like/pass/super-like, undo.
- Recommendation v1: content-based scoring against stated preferences, with diversity
  and a "recently popular" boost, plus a plain-language explanation per card.
- Match logic (mutual simulated interest) and a matches list.
- "It's a match" celebration screen.

### M2 — Chat, accounts, safety

- Streaming chat with matched models, persisted history, and conversation starters.
- Per-model persona prompts so each model feels distinct.
- Moderation, AI disclosure, rate limits, and report/block flows.
- Full account settings: edit profile, export data, delete account.
- Optional account upgrade from guest so progress is never lost.

### M3 — Discovery & quality

- A freshness job that ingests popularity and release signals so the catalog stays
  "recently popular" without hand-editing.
- Recommendation v2: learn from swipe history, add exploration, and tune diversity.
- "Most liked models" leaderboard and a rotating model of the day.
- Shareable match cards with generated Open Graph images.
- A lightweight admin for catalog CRUD and moderation review.

### M4 — Launch

- Product analytics and a funnel dashboard (onboard → swipe → match → chat).
- Accessibility and responsive audits, plus performance budgets.
- End-to-end test coverage for the core loop.
- Production deployment, monitoring, error tracking, and spend alerts.
- Landing page and contributor documentation.

---

## Proposed architecture

A single TypeScript web app keeps the MVP small and fast to iterate on.

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js (App Router) + TypeScript | One codebase for UI and API, great DX, easy deploys |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion | Fast to build a distinctive, animated UI |
| Database | PostgreSQL + Prisma | Relational fit for swipes/matches/messages; typed client |
| Auth | Auth.js (guest sessions + email magic link) | Low-friction onboarding, upgradeable accounts |
| AI | OpenRouter (or direct provider SDKs) behind an adapter | One interface for many models; easy swapping and spend caps |
| Storage | S3-compatible bucket for avatars/OG images | Cheap, CDN-friendly |
| Deploy | Vercel + managed Postgres (Neon/Supabase) | Preview deploys, minimal ops |
| Tests | Vitest + Playwright | Fast unit tests, real-browser core-flow tests |

The LLM provider sits behind a small `ModelProvider` interface so a match can be served
by a hosted API in production or a local model in development.

### Data model (sketch)

```
users            id, email?, is_guest, created_at, deleted_at
profiles         user_id, display_name, bio, avatar_url, age?, location?
preferences      user_id, traits[], interests[], modalities[], values[],
                 open_weights_pref, cost_sensitivity, context_importance,
                 temperature_pref, dealbreakers[]
models           id, slug, name, provider, family, release_date, description,
                 avatar_url, context_window, params_b?, modalities[], license,
                 pricing, benchmark_refs, is_active
model_traits     model_id, trait, weight          -- "funny", "concise", "deep"…
model_personas   model_id, system_prompt, starters[]
swipes           user_id, model_id, direction, created_at, undone_at?
matches          user_id, model_id, compatibility, created_at, status
messages         match_id, role, content, tokens, created_at
events           user_id, name, props, created_at
```

---

## Model catalog

The catalog is the heart of the app. It is a **versioned seed dataset** (YAML/JSON in
the repo, loaded by a seed script) so it is reviewable and reproducible.

Each model profile combines:

- **Facts** — provider, release date, context window, parameter count, modalities,
  license, pricing, and links to public benchmarks.
- **Interpretation** — traits (`warm`, `witty`, `rigorous`, `chaotic`, `concise`),
  "loves", "turn-offs", and a short dating-style bio.
- **Presentation** — avatar, accent color, and a few conversation starters.

**Sourcing:** seed and refresh from public, attributable sources such as OpenRouter's
model list, the Hugging Face Hub, LMArena, and Artificial Analysis. Facts are stored
with a source URL and a `last_verified_at` date. **We do not invent benchmark numbers**;
if a fact cannot be verified, it is omitted rather than guessed. Interpretive traits are
editorial and clearly marked as such.

**Starter lineup (illustrative, to be verified during curation):** the initial catalog
should span the major hosted families and the open-weight ecosystem — e.g. OpenAI GPT,
Anthropic Claude, Google Gemini, Meta Llama, Mistral, DeepSeek, Qwen, xAI Grok, Moonshot
Kimi, Z.ai GLM, MiniMax, Cohere Command, Amazon Nova, and Microsoft Phi. Exact models,
specs, and release dates come from the linked sources, never from memory.

---

## Recommendation v1

A transparent, tunable score rather than a black box:

```
score = 0.30 · interest_overlap
      + 0.20 · trait_match
      + 0.15 · modality_fit
      + 0.10 · context_fit
      + 0.10 · value_alignment
      + 0.10 · popularity_boost      # "recently popular"
      + 0.05 · novelty               # avoid showing the same family twice
      - 1.00 · dealbreaker_hit       # hard filter
```

Notes:

- Excluded models (blocked, already swiped, dealbreaker) are filtered before ranking.
- The deck is re-ranked with a diversity pass so it never becomes five GPTs in a row.
- Each recommendation returns the top two contributing reasons, rendered on the card.
- Cold start falls back to popularity plus a short onboarding taste quiz.
- Every weight lives in config so it can be tuned without a deploy.

---

## Milestones & backlog

Each milestone below maps to a GitHub milestone; individual issues carry acceptance
criteria, dependencies, and size/area labels.

- **M0 — Foundations** — spec, scaffold, schema, design system, dev env, CI, catalog format.
- **M1 — MVP** — auth, onboarding, catalog, swipe deck, recommender v1, matching.
- **M2 — Chat & safety** — streaming chat, personas, moderation, account settings.
- **M3 — Discovery** — trend ingestion, recommender v2, leaderboard, sharing, admin.
- **M4 — Launch** — analytics, accessibility, E2E, deployment, landing page, docs.

<!-- backlog-index:start -->

<details>
<summary><strong>M0 — Foundations</strong> — 7 issues</summary>

- [#1](https://github.com/neubig/tensr/issues/1) — Write the product spec, personas, and success metrics
- [#2](https://github.com/neubig/tensr/issues/2) — Scaffold the Next.js app and repository structure
- [#3](https://github.com/neubig/tensr/issues/3) — Add CI for lint, typecheck, and unit tests
- [#4](https://github.com/neubig/tensr/issues/4) — Define the database schema and Prisma migrations
- [#5](https://github.com/neubig/tensr/issues/5) — Establish the visual identity and UI primitives
- [#6](https://github.com/neubig/tensr/issues/6) — Set up local development with Postgres, env template, and seed command
- [#7](https://github.com/neubig/tensr/issues/7) — Define the model catalog data format and loader

</details>

<details>
<summary><strong>M1 — MVP: profile → swipe → match</strong> — 12 issues</summary>

- [#8](https://github.com/neubig/tensr/issues/8) — Implement guest sessions and email magic-link auth
- [#9](https://github.com/neubig/tensr/issues/9) — Add profile and preference CRUD APIs with validation
- [#10](https://github.com/neubig/tensr/issues/10) — Build the multi-step onboarding wizard
- [#11](https://github.com/neubig/tensr/issues/11) — Add avatar upload and generated-avatar fallback
- [#12](https://github.com/neubig/tensr/issues/12) — Curate the initial dataset of 50+ recently popular models
- [#13](https://github.com/neubig/tensr/issues/13) — Build the model catalog API (list, search, filter, detail)
- [#14](https://github.com/neubig/tensr/issues/14) — Build the model profile detail page
- [#15](https://github.com/neubig/tensr/issues/15) — Build the swipe deck with gestures and keyboard support
- [#16](https://github.com/neubig/tensr/issues/16) — Persist swipes with undo and daily limits
- [#17](https://github.com/neubig/tensr/issues/17) — Implement recommendation v1 with explanations
- [#18](https://github.com/neubig/tensr/issues/18) — Implement match logic and the matches list
- [#19](https://github.com/neubig/tensr/issues/19) — Build the 'It's a match' celebration screen

</details>

<details>
<summary><strong>M2 — Chat, accounts & safety</strong> — 6 issues</summary>

- [#20](https://github.com/neubig/tensr/issues/20) — Build streaming chat APIs with persistence
- [#21](https://github.com/neubig/tensr/issues/21) — Build the chat interface with history and starters
- [#22](https://github.com/neubig/tensr/issues/22) — Write per-model persona prompts and conversation starters
- [#23](https://github.com/neubig/tensr/issues/23) — Add chat moderation, AI disclosure, and report/block flows
- [#24](https://github.com/neubig/tensr/issues/24) — Build account settings: edit profile, export, delete
- [#25](https://github.com/neubig/tensr/issues/25) — Add inference spend caps and provider rate limiting

</details>

<details>
<summary><strong>M3 — Discovery & quality</strong> — 5 issues</summary>

- [#26](https://github.com/neubig/tensr/issues/26) — Build the popularity and release-signal ingestion job
- [#27](https://github.com/neubig/tensr/issues/27) — Learn from swipe history and tune diversity/exploration
- [#28](https://github.com/neubig/tensr/issues/28) — Add most-liked leaderboard and model of the day
- [#29](https://github.com/neubig/tensr/issues/29) — Generate shareable match cards with Open Graph images
- [#30](https://github.com/neubig/tensr/issues/30) — Build an admin catalog and moderation console

</details>

<details>
<summary><strong>M4 — Launch</strong> — 7 issues</summary>

- [#31](https://github.com/neubig/tensr/issues/31) — Instrument analytics events and a funnel dashboard
- [#32](https://github.com/neubig/tensr/issues/32) — Run accessibility and responsive audits and fix findings
- [#33](https://github.com/neubig/tensr/issues/33) — Add Playwright E2E coverage for the core loop
- [#34](https://github.com/neubig/tensr/issues/34) — Deploy to production with monitoring and error tracking
- [#35](https://github.com/neubig/tensr/issues/35) — Build the landing page with SEO and social previews
- [#36](https://github.com/neubig/tensr/issues/36) — Set and enforce performance budgets
- [#37](https://github.com/neubig/tensr/issues/37) — Add contributor docs, issue templates, and CONTRIBUTING

</details>

<!-- backlog-index:end -->

New contributors: start with issues labeled [`good first issue`](../../labels/good%20first%20issue).

---

## Non-goals (v1)

- Humans dating humans.
- Fine-tuning or training models.
- Payments, subscriptions, or ads.
- Native mobile apps (the web app is mobile-first; native can come later).
- Voice or video "dates".

---

## License

TBD.
