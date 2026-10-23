# tensr — Product spec

**Status:** pre-alpha decision document · **Owner:** [@neubig](https://github.com/neubig) · **Last updated:** 2026-10-23

**Read with:** the [README](../README.md) (milestone plan, architecture) and [#31](https://github.com/neubig/tensr/issues/31) (analytics).

A short decision document: what the product is, who it is for, what we will not build, and what
"working" means. Instrumentation itself is out of scope and lands in #31.

## 1. What we are building

tensr is a playful, mobile-first web app where you swipe on dating profiles for recently popular
LLMs and, when the interest is mutual, chat with the model in character.

**Target user.** 18–34, extremely online, already talks to LLMs for fun and screenshots it for
friends. Primary: here for the joke and the tactility. Secondary: here for a low-stakes chat that
always answers. We are not building for people seeking to date humans (§5).

**North star:** *weekly chatting users* — activated users who send at least one message to a match
in a 7-day window. Every metric below is a leading indicator for it.

## 2. Core loop

**Onboard → swipe → match → chat.** The loop closes only when a chat start brings the user back
(D1/D7); a match with no conversation is a dead end.

1. **Onboard** (≈2 min, skippable): name, optional avatar and bio, preferences. Display name is the
   only required field; the survey can be skipped and edited later.
2. **Swipe:** a personalized deck, each card with a plain-language "why this match". Left = pass,
   right = like, up = super-like, with undo.
3. **Match:** mutual — the model's simulated preference profile is compatible too. Celebrated and saved.
4. **Chat:** streaming, in-character replies with persistent history, every thread labeled AI.

Each step is a funnel step for #31 and has a metric in §6.

## 3. Tone

Playful and self-aware. The joke is *"you are dating an LLM"*, never *"you are lonely"*.

- **Punch at the app and the models, never the user.** Failure copy can be funny; user-shaming copy cannot.
- **Flirty, not horny.** PG-13; report and block stay one tap away.
- **Honest about AI.** Cards and threads are labeled; no pretend-human characters. An outage is an
  outage, never a model "ghosting" you.
- **Short.** One or two lines per card, no walls of text.

## 4. Personas

| Persona | Job they hire tensr to do | Behavior that serves it | Signal |
| --- | --- | --- | --- |
| **Maya, 24** — CS grad student, lives in group chats | "Give me a 90-second break funny enough to screenshot." | Guest onboarding (no signup), instant deck, absurdly specific personas, shareable match cards (#29). | Same-session swipe-through, share taps, D1 return |
| **Devon, 31** — PM at an AI-adjacent company | "Build my intuition about how models differ without reading benchmarks." | Explainable "why this match" (#17), sourced catalog facts and detail pages (#14), distinct personas, model of the day (#28). | Catalog views per session, chats with ≥2 models, D7 |
| **Priya, 27** — non-technical, casually dating | "Give me a harmless flirt that always replies and never ghosts." | Match celebration (#19), starters (#22), persistent history, visible AI disclosure and report/block (#23). | Chat starts, messages per chat; report rate guardrail |

Maya is the primary persona for M1; Priya's job must hold for retention in M2. If they conflict,
optimize for Maya and record the trade-off in §9.

## 5. Non-goals (v1, through M4)

Each line is a rejection rule. A proposal needing one needs a decisions-log entry first; default no.

- **Humans dating humans.** No human profiles, human-to-human DMs, or "date a real person" mode.
- **Fine-tuning or training.** Chat logs are not training data.
- **Payments, subscriptions, ads, or a business model.** Free through M4.
- **Native mobile apps.** Mobile-first web only.
- **Voice or video "dates".** Text chat only.
- **NSFW/erotic roleplay or an "unfiltered" toggle.** Moderation is not a user preference.
- **User-authored model personas.** The catalog is curated and versioned (#7, #12).
- **Social features between users.** No feed, public timeline, user leaderboard, or comments.
- **Legal, privacy-policy, or brand/marketing work.** This document is not the privacy policy.

Also out of scope here: the analytics schema and dashboard (#31), E2E tests (#33), performance
budgets (#36), landing-page copy (#35), and the moderation console (#30).

## 6. Success metrics

Measured from the #31 funnel dashboard once it exists; until then the same definitions are queried
in SQL over `events`, `swipes`, `matches`, and `messages`. Cohorts are activated users by UTC
activation date, excluding internal and test users. Evaluate a target only at n ≥ 100 users in the
cohort; otherwise report raw counts and mark it inconclusive.

| Metric | Definition | Source |
| --- | --- | --- |
| **Activation** | Share of new user sessions that complete onboarding (display name set) **and** render ≥1 deck card in that session. Guests count; signup alone is not activation. | events (#16, #31) |
| **Swipe-through rate** | Card decisions (like/pass/super-like) ÷ first-time card impressions. An undone and re-decided card counts once; re-served cards add no impressions. | swipes, impressions (#16) |
| **Match rate** | Matches created ÷ right and super-likes. Unit is the like, not the user. Tuning band **30–45%** (#18); outside 20–60% for 7 days is a guardrail breach. | matches, swipes (#18) |
| **Chat starts** | Share of new matches with ≥1 user message within 24 h of match creation. | messages (#20) |
| **D1 / D7 retention** | Share of activated users with ≥1 event on the calendar day (UTC) 1 or 7 days after activation day. Point-in-time, not a window. | events (#31) |

**M0 is deliberately not applicable to funnel metrics:** there is no user-facing surface, so every
denominator is zero. M0 is measured by readiness instead — all five funnel steps have a trigger,
owner, and denominator agreed in #31's taxonomy, every metric here names a source, and a seeded dev
database answers the activation, swipe-through, and match-rate queries end to end before M1 beta.

| Metric | M1 | M2 | M3 | M4 |
| --- | --- | --- | --- | --- |
| Activation | ≥ 50% | ≥ 55% | ≥ 60% | ≥ 65% |
| Swipe-through rate | ≥ 50% | ≥ 55% | ≥ 60% | ≥ 65% |
| Match rate | 30–45% | 30–45% | 30–45% | 30–45% |
| Chat starts | n/a — chat ships in M2 | ≥ 50% | ≥ 55% | ≥ 60% |
| D1 retention | ≥ 20% | ≥ 25% | ≥ 30% | ≥ 35% |
| D7 retention | ≥ 8% | ≥ 12% | ≥ 18% | ≥ 22% |

Supporting targets: M1 — ≥ 60% of activated users match within 7 days and ≥ 40% of activated
sessions record 10+ swipes. M2 — median started chat has ≥ 4 messages. M3 — ≥ 30% of activated users
chat with ≥ 2 distinct models in a week. M4 — D7 among users who started a chat is ≥ 2× D7 among
those who did not.

## 7. Failure metrics and guardrails

Thresholds are initial hypotheses, recalibrated against a real M2 baseline. Every breach has an
owner and a written response.

| Guardrail | Threshold and intent | Response |
| --- | --- | --- |
| **Inference cost per DAU** | 7-day inference spend (provider invoices + amortized local GPU) ÷ 7-day active users. Target ≤ $0.15/DAU at M2, ≤ $0.10 at M4. Alert at > $0.20 for 3 days or any day > $0.30. | Owner #25: inspect cost per model, trim context/output tokens, lower per-user budgets, pause the priciest model. #25's global hard stop stays authoritative. |
| **Report rate** | Reports per 1,000 assistant messages, 7-day rolling. Target < 5; alert > 10, and any credible severe-harm report alerts immediately. | Owner #23: review the transcript, tighten moderation thresholds, suspend the persona if warranted, log it in §9. |
| **Match-rate collapse** | Outside 20–60% over 7 days, or a 10-point week-over-week drop. | Owner #18: check simulated preference profiles and retune to the 30–45% band. |
| **Chat failure rate** | > 2% of send or stream attempts fail. | Owner #20: check provider status, retries, limits; show honest error copy, not fake in-character errors. |
| **Privacy** | Any raw message text or email in analytics properties. | Launch blocker (#31): remove the property, audit the taxonomy, do not ship the milestone. |

## 8. Open questions

| Question | Owner | Resolution path |
| --- | --- | --- |
| Toy for AI tinkerers (Maya) or comfort product for casual chatters (Priya)? | @neubig | End of M1: split activation and D7 by acquisition source. If one cohort is < 25% of activated users, narrow §1 to the other. |
| Age gate: 18+ only, or 13+ with extra safeguards? | @neubig | Before #23 starts; blocking for moderation/legal. Default if unresolved: 18+. |
| Full accounts at launch, or guest-only with export/delete? | @neubig | M2 exit (#8, #24) using guest→account upgrade rate; < 10% means accounts stay optional. |
| What feeds the recommender's popularity signal before #26? | #17 owner | Decide at M1 kickoff: curated catalog score vs. release-recency proxy. #26 replaces it in M3. |
| Are shareable match cards public by default? | @neubig | Before #29 starts; default is opt-in per card. |
| Should matches ever initiate a message? | @neubig | After M2, using chat-start and D7 data. No current issue assumes it. |
| Monetization. | @neubig | Out of scope through M4; revisit only if cost per DAU breaches guardrails and cannot be fixed technically. |

## 9. Decisions log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-23 | Core loop is onboard → swipe → match → chat; the deck is the entry point, catalog browsing (#13, #14) is secondary. | Matches the README and keeps the funnel measurable. |
| 2026-10-23 | Activation = onboarding complete + first deck card, same session. Guests are users. | A signup-only definition would hide onboarding friction. |
| 2026-10-23 | Match rate is tuned to 30–45% of likes/super-likes. | Enough matches to feel wanted, not so many they feel cheap. #18 tunes to this. |
| 2026-10-23 | No account required for the core loop; email only preserves progress. | Onboarding friction is the top activation risk (#8). |
| 2026-10-23 | All profiles are labeled AI; no human characters or human-to-human DMs. | "Honest about AI" is a product principle, not an option. |
| 2026-10-23 | Measure from application tables until #31 ships. | Avoids blocking M1–M3 on instrumentation. |
| 2026-10-23 | The §5 non-goals are binding for v1; adding one requires an entry here. | Keeps scope creep reviewable. |

**Changing this document:** open a PR, add a dated decisions-log row for anything that changes
behavior, targets, or scope, and update §8 when a question is resolved.
