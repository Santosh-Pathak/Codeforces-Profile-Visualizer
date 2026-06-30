# Codeforces Insights

**A free, client-side analytics dashboard for Codeforces competitive programmers.**

Enter any handle and get a rich profile visualizer — rating history, contest analytics, submission breakdowns, activity heatmaps, tag analysis, rule-based insights, practice recommendations, and achievement badges. Everything runs in your browser: no backend, no database, no login.

> Also known as **Codeforces Profile Visualizer** — built for CP enthusiasts who want deeper stats than the official profile page.

## Screenshots

### Homepage

Search any handle or paste a profile URL to get started — no login required.

![Codeforces Insights homepage — search and feature highlights](./public/Screenshot%202026-06-30%20235655.png)

### Dashboard

Full analytics for a Codeforces profile: sidebar navigation, profile card, summary stats, charts, and more.

![Codeforces Insights dashboard — profile and summary stats](./public/Screenshot%202026-06-30%20235739.png)

---

## Table of Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Upcoming Features](#upcoming-features)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

---

## Features

### Profile & summary

- **Profile card** — avatar, rank badge, rating, country, organization, contribution, friends, registration date, last online, link to Codeforces
- **Summary stats** — current/max rating, contest count, best/worst/average rank, largest gain/loss with animated count-up numbers

### Contests & rating

- **Rating history chart** — line chart with rating-band overlays, gradient fill, zoom/pan, tooltips (Y-axis capped at 4000)
- **Rating changes** — SPC-style control chart of per-contest deltas with UCL/CL/LCL reference lines
- **Contest timeline** — sortable, paginated table (virtualized for 100+ rows)
- **Contest analytics** — aggregated stats including consistency score

### Submissions & problems

- **Submission statistics** — verdict breakdown (AC, WA, TLE, MLE, RE, CE, Other) with doughnut chart
- **Language breakdown** — pie + bar charts with top-language badge
- **Problem solving stats** — total/unique solved, average & peak difficulty, rating histogram
- **Tag analysis** — top tags by solve count (horizontal bar chart)
- **Weak & strong topics** — bottom 5 weak areas with Codeforces practice links; top 10 strong tags
- **Verdict distribution** & **problem rating distribution** charts

### Activity

- **Activity heatmap** — GitHub-style calendar (AC submissions per day)
- **Daily / monthly / yearly activity** — weekday bars, monthly line, yearly bars

### Insights & practice

- **AI insights** — 10+ rule-based observations from computed stats (no external AI API)
- **Practice recommendations** — unsolved problems near your rating, prioritized by weak tags
- **Achievements** — unlockable badges for solves, contests, and rank milestones

### UX & polish

- **Light / dark theme** — persistent toggle with accessible contrast on homepage and dashboard
- **Per-section year filters** — default to current year; optional “All Time” (except Rating Changes)
- **Collapsible sidebar** — icon-only mode, fixed while scrolling, internal scroll for all nav items
- **Mobile navigation** — drawer menu below the `lg` breakpoint
- **Phased data loading** — fast initial load (profile + contests + recent submissions), full history on demand
- **PDF export** — print-friendly layout via `window.print()` and `print.css`
- **Error handling** — user-not-found, rate-limit countdown, partial-failure warning banner, per-section error boundaries
- **Back navigation** — return to homepage from the dashboard header

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- npm 9+

### Install & run

```bash
git clone https://github.com/Santosh-Pathak/Codeforces-Profile-Visualizer.git
cd Codeforces-Profile-Visualizer
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`), then:

1. Enter a Codeforces handle (e.g. `tourist`), or paste a profile URL like `https://codeforces.com/profile/tourist`
2. Click **Analyze** to open the dashboard at `/user/{handle}`

### Other scripts

```bash
npm run build      # type-check (tsc -b) + production build → dist/
npm run preview    # serve the production build locally
npm run test       # property-based test suite (Vitest + fast-check)
npm run test:watch # tests in watch mode
npm run typecheck  # TypeScript check only
npm run lint       # ESLint
```

---

## Tech Stack

| Layer | Tools |
|-------|--------|
| UI | React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion |
| Build | Vite 6 |
| Routing | React Router DOM (lazy-loaded dashboard) |
| HTTP | Axios — retry, exponential backoff, normalized `{ data, error, status }` |
| Charts | Chart.js, react-chartjs-2, annotation / zoom / datalabels plugins |
| Heatmap | react-calendar-heatmap |
| Tables | react-window (virtualized contest rows) |
| Dates | date-fns |
| Icons | @heroicons/react |
| Tests | Vitest, fast-check, Testing Library |

---

## Project Structure

```
src/
├── main.tsx                    # Entry; global Chart.js registration
├── App.tsx                     # Router + lazy DashboardPage
├── types/                      # CF API models, ComputedStats, hook types
├── constants/                  # Rank colors, rating bands, badges, tags, verdicts
├── services/                   # Axios client + API functions
├── hooks/
│   ├── useCodeforcesData.ts    # Fetching, cache, phased full-history load
│   ├── useYearFilter.ts        # Per-section year filtering
│   ├── useTheme.ts             # Light/dark theme store
│   └── useSidebarCollapsed.ts  # Sidebar collapse + layout CSS variable
├── contexts/                   # CodeforcesDataContext (ensureFullHistory, loadingMore)
├── utils/                      # Stat calculators, cache, validators, recommendations, …
├── pages/                      # HomePage, DashboardPage, NotFoundPage
├── components/
│   ├── ui/                     # GlassCard, Button, YearFilter, ThemeToggle, …
│   ├── layout/                 # Sidebar, MobileNav, PageWrapper
│   └── *.tsx                   # Dashboard section components
├── charts/                     # Chart.js wrappers
├── styles/                     # index.css, print.css
└── __tests__/properties/       # Property-based tests
```

---

## Architecture

### Data layer

`useCodeforcesData(handle)` is the single source of truth for API access.

**Phase 1 (fast path)** — fetched in parallel on load:

- `user.info`
- `user.rating`
- `user.status?count=500` (recent submissions)

**Phase 2 (on demand)** — triggered when a section needs full history or the problemset:

- Full submissions (`count=10000`)
- `problemset.problems` (for recommendations and rated problem metadata)

Results are cached in `localStorage` for **15 minutes** per handle. `refetch()` clears the cache and reloads. In-flight requests abort when the handle changes.

### Resilience

| Scenario | Behavior |
|----------|----------|
| HTTP 400 | “No user found” card with search-again action |
| HTTP 429 | Countdown timer using `Retry-After` |
| Partial API failure | Render available sections + warning banner |
| All endpoints fail | Network error card with retry |

### Performance

- Dashboard code-split via `React.lazy` + `Suspense`
- Charts and heavy sections wrapped in `React.memo`
- Derived stats computed with `useMemo`; handlers with `useCallback`
- Contest table virtualized when row count exceeds 100

---

## Testing

Correctness is verified with [fast-check](https://github.com/dubzzz/fast-check) property tests under `src/__tests__/properties/` (100 iterations each), covering:

- API client normalization and retry behavior
- Cache round-trip fidelity
- Stat calculators and problem binning
- Recommendation filters
- Achievement badge evaluation
- Validators and formatters

Run the suite before opening a pull request:

```bash
npm run test
npm run typecheck
npm run lint
```

---

## Upcoming Features

Ideas on the roadmap — contributions welcome on any of these:

| Priority | Feature | Description |
|----------|---------|-------------|
| High | **Recent & favorite handles** | Quick-access list on the homepage from `localStorage` |
| High | **Global year filter** | One control to sync all dashboard sections |
| High | **User comparison** | Side-by-side stats for two handles (rating overlay, tags, solves) |
| High | **Upsolve vs contest split** | Separate AC counts for practice vs rated contests |
| Medium | **Upcoming contests widget** | Use `contest.list` API (already in services) |
| Medium | **First-attempt success rate** | AC on first submission per tag/problem |
| Medium | **Submission time analysis** | Charts from `timeConsumedMillis` |
| Medium | **Streaks & goals** | Daily solve streaks, optional rating targets |
| Medium | **Shareable profile link** | Copy URL + optional summary card |
| Medium | **IndexedDB problemset cache** | Faster repeat visits for recommendations |
| Polish | **Richer PDF export** | Section picker, landscape charts |
| Polish | **PWA / offline** | Cache last-viewed profile for offline reading |
| Polish | **Accessibility** | Chart summaries, `prefers-reduced-motion`, keyboard nav |

Have another idea? [Open an issue](https://github.com/Santosh-Pathak/Codeforces-Profile-Visualizer/issues) or jump in with a PR.

---

## Contributing

Contributions of all sizes are welcome — bug fixes, new charts, UX improvements, tests, and documentation.

### How to contribute

1. **Fork** the repository and clone your fork locally.
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** — keep diffs focused; match existing TypeScript and Tailwind conventions.
4. **Run checks**:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```
5. **Commit** with a clear message (e.g. `feat: add global year filter`, `fix: sidebar scroll on mobile`).
6. **Push** and open a **Pull Request** against `main`. Describe what changed and how you tested it.

### Guidelines

- **No secrets** — this app is client-only; do not commit API keys or `.env` files.
- **Stay client-side** — features should work without a custom backend when possible (Codeforces API only).
- **Test logic in `utils/`** — add or extend property tests for new calculators or filters.
- **Respect rate limits** — avoid unnecessary duplicate API calls; use the existing cache and phased fetch patterns.
- **UI consistency** — use `GlassCard`, theme tokens, and `SectionHeader` for new dashboard sections.

### Good first issues

- Homepage recent-search chips
- Sidebar section search/filter
- Clearer “loading full history” progress text
- Chart “reset zoom” buttons
- Additional achievement badges

Questions or design proposals? Start a [Discussion](https://github.com/Santosh-Pathak/Codeforces-Profile-Visualizer/discussions) or issue before large refactors.

---

## Acknowledgements

- [Codeforces](https://codeforces.com) for the public REST API and the competitive programming community.
- [Chart.js](https://www.chartjs.org/), [Tailwind CSS](https://tailwindcss.com/), and the open-source libraries listed above.

---

**If this project helped you understand your Codeforces journey, consider starring the repo and sharing it with your team or study group.**
