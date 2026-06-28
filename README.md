# Codeforces Insights

A fully client-side analytics dashboard for Codeforces competitive programmers.
It fetches data directly from the official Codeforces REST API and renders rich
analytics — rating history, submission statistics, tag analysis, activity
heatmaps, AI-style insights, practice recommendations, and achievement badges —
entirely in the browser. No backend, no database, no authentication.

## Tech Stack

- **React 19** + **Vite 6** (TypeScript, strict mode)
- **Axios** for HTTP with retry / exponential backoff and normalized responses
- **React Router DOM** for routing (lazy-loaded dashboard)
- **Chart.js** / **react-chartjs-2** (+ annotation, zoom, datalabels plugins)
- **react-calendar-heatmap** for the activity heatmap
- **react-window** for virtualizing the contest table
- **Framer Motion** for animations
- **Tailwind CSS v4** for styling (dark mode only, glassmorphism)
- **date-fns** for date formatting
- **@heroicons/react** for icons
- **Vitest** + **fast-check** for property-based tests

## Getting Started

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run build    # type-check (tsc -b) and produce a production build in dist/
npm run preview  # preview the production build
npm run test     # run the property-based test suite
npm run typecheck# type-check only
npm run lint     # lint the project
```

Then open the app, enter any Codeforces handle (or a full profile URL such as
`https://codeforces.com/profile/tourist`) and explore the dashboard.

## Project Structure

```
src/
├── main.tsx                 # Entry point; global Chart.js registration; CSS imports
├── App.tsx                  # Router + lazy DashboardPage
├── types/                   # Shared TypeScript types (CF models, ComputedStats, …)
├── constants/               # RANK_COLORS, RATING_BANDS, BADGE_DEFINITIONS, TAG_LIST, verdicts
├── services/                # Axios instance (retry/backoff) + 5 API functions
├── hooks/                   # useCodeforcesData (caching, parallel fetch, refetch)
├── utils/                   # Pure stat calculators, formatters, validators, etc.
├── pages/                   # HomePage, DashboardPage, NotFoundPage
├── components/
│   ├── ui/                  # GlassCard, Button, Badge, Skeleton, Tooltip, …
│   ├── layout/              # Sidebar, MobileNav, PageWrapper, SectionHeader
│   └── *.tsx                # 22 dashboard section components
├── charts/                  # Chart.js wrapper components
├── styles/                  # index.css (Tailwind + theme) and print.css
└── __tests__/properties/    # fast-check property tests
```

## Architecture Notes

- **Single data hook**: `useCodeforcesData(handle)` is the only place that calls
  the API. It fetches all five endpoints in parallel with `Promise.allSettled`,
  caches successful results in `localStorage` for 15 minutes, supports
  `refetch()`, and aborts in-flight requests on handle change.
- **Graceful degradation**: partial API failures still render available sections
  with a warning banner; 400 shows a "No user found" card; 429 shows a countdown.
- **Performance**: every chart and section is wrapped in `React.memo`, all
  derived data is computed with `useMemo`, event handlers use `useCallback`, and
  the dashboard is code-split via `React.lazy` + `Suspense`.
- **PDF export**: "Download as PDF" calls `window.print()` with a dedicated
  `print.css` stylesheet — no external PDF library.

## Testing

Correctness properties (data shape, caching round-trip, stat formulas, bin
assignment, recommendations window, badge evaluation, etc.) are verified with
[fast-check](https://github.com/dubzzz/fast-check) property-based tests under
`src/__tests__/properties/`, each running 100 iterations.
