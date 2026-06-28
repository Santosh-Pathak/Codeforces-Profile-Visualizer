# Design Document — Codeforces Insights

## Overview

Codeforces Insights is a fully client-side single-page application (SPA) that fetches data from the official Codeforces REST API and renders a rich analytics dashboard in the browser. There is no backend, no database, and no authentication layer. All processing — data fetching, caching, computation, and rendering — happens in the user's browser.

The application is built with React 19 + Vite, uses Axios for HTTP, React Router DOM for navigation, Chart.js / react-chartjs-2 for visualizations, Tailwind CSS for styling, Framer Motion for animations, and date-fns for date formatting. Charts are supplemented with react-calendar-heatmap for the activity heatmap.

### Key Design Decisions

- **Client-only architecture**: avoids CORS issues because Codeforces API responses include permissive headers; no server-side secret management needed.
- **Single custom hook as data layer**: `useCodeforcesData` is the single source of truth; components never call the API directly.
- **localStorage TTL cache**: reduces redundant API calls while respecting the 15-minute staleness window.
- **Promise.allSettled for parallelism**: all five API endpoints are fetched concurrently; partial failures degrade gracefully.
- **React.memo + useMemo + useCallback pervasively**: prevents re-renders on a data-heavy dashboard with 22+ sections.
- **React.lazy + Suspense for code splitting**: the Dashboard page is lazily loaded so the homepage remains fast.
- **react-window for virtualization**: the Contest Table virtualizes rows when count exceeds 100.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite dev / static build)                         │  │
│  │                                                               │  │
│  │  ┌──────────────┐    ┌──────────────────────────────────┐    │  │
│  │  │  React Router │    │  useCodeforcesData(handle)        │    │  │
│  │  │  /           │    │  ┌──────────────────────────┐     │    │  │
│  │  │  /user/:h    │───▶│  │  localStorage TTL cache  │     │    │  │
│  │  └──────────────┘    │  └──────────┬───────────────┘     │    │  │
│  │                      │             │ miss / expired       │    │  │
│  │                      │  ┌──────────▼───────────────┐     │    │  │
│  │                      │  │  API_Client (Axios)       │     │    │  │
│  │                      │  │  retry + backoff          │     │    │  │
│  │                      │  └──────────┬───────────────┘     │    │  │
│  │                      └────────────┼────────────────────┘    │  │
│  │                                   │                           │  │
│  └───────────────────────────────────┼───────────────────────────┘  │
│                                      │ HTTPS                        │
│  ┌───────────────────────────────────▼───────────────────────────┐  │
│  │  Codeforces REST API  (codeforces.com/api)                    │  │
│  │  /user.info  /user.rating  /user.status                       │  │
│  │  /problemset.problems  /contest.list                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User types handle → Homepage validates → navigate("/user/:handle")
  → Dashboard mounts → useCodeforcesData(handle)
    → check localStorage (cache hit? return cached data)
    → cache miss: Promise.allSettled([5 API calls])
      → normalize responses → merge into state
      → write to localStorage with timestamp
  → loading=false → stat utils compute derived data
  → 22 dashboard sections render with memoized props
```

---

## Components and Interfaces

### Component Hierarchy

```
App
├── Router
│   ├── Route "/"           → <HomePage />
│   └── Route "/user/:handle" → <Suspense> → lazy(<DashboardPage />)
│       └── DashboardPage
│           ├── <TopProgressBar />        (loading indicator)
│           ├── <Sidebar />               (lg+ only)
│           ├── <MobileNav />             (< lg)
│           └── <main>
│               ├── <ProfileCard />
│               ├── <SummaryStats />
│               ├── <RatingHistoryChart />
│               ├── <RatingChangeChart />
│               ├── <ContestTable />
│               ├── <ContestAnalytics />
│               ├── <SubmissionStats />
│               ├── <LanguageBreakdown />
│               ├── <ProblemStats />
│               ├── <TagAnalysis />
│               ├── <WeakTopics />
│               ├── <StrongTopics />
│               ├── <ActivityHeatmap />
│               ├── <DailyActivityChart />
│               ├── <MonthlyActivityChart />
│               ├── <YearlyActivityChart />
│               ├── <VerdictDistribution />
│               ├── <ProblemRatingDistribution />
│               ├── <AiInsights />
│               ├── <PracticeRecommendations />
│               └── <Achievements />
```

### Props Contracts (TypeScript-style interfaces)

```ts
// API layer
interface NormalizedResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  retryAfter?: number; // only on 429
}

// Hook return type
interface CodeforcesData {
  profile:     CFUserInfo | null;
  contests:    CFRatingChange[] | null;
  submissions: CFSubmission[] | null;
  problems:    CFProblem[] | null;
  loading:     boolean;
  error:       string | null;
  refetch:     () => void;
}

// Computed stats (passed to AI Insights, Achievements, Recommendations)
interface ComputedStats {
  totalAC:            number;
  uniqueSolved:       number;
  avgDifficulty:      number | null;
  highestDifficulty:  number | null;
  totalContests:      number;
  bestRank:           number | null;
  worstRank:          number | null;
  avgRank:            number | null;
  highestGain:        number | null;
  biggestLoss:        number | null;
  consistencyScore:   number | null;
  topLanguage:        string | null;
  weakTags:           string[];
  strongTags:         string[];
  ratingTrend:        'up' | 'down' | 'flat' | null;
  submissionFreq:     number; // avg submissions per active day
}
```

---

## Data Models

### Codeforces API Response Models

```ts
interface CFUserInfo {
  handle: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

interface CFRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
    tags: string[];
  };
  author: { members: { handle: string }[] };
  programmingLanguage: string;
  verdict?: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

interface CFProblem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}
```

### Cache Schema

```ts
interface CacheEntry<T> {
  timestamp: number;    // Date.now() ms
  ttl: number;          // 900_000 ms (15 min)
  data: T;
}
// localStorage key: "cf_insights_{handle_lowercase}"
```

---

## API Layer Design (`src/services/`)

### File: `src/services/apiClient.js`

The Axios instance is created once and exported. Retry logic is implemented via an Axios response interceptor using a recursive approach with exponential backoff.

```js
// Pseudo-structure (not runnable — illustrative)

const BASE_URL = 'https://codeforces.com/api';
const TIMEOUT  = 10_000;
const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [1000, 2000, 4000]; // ms

const axiosInstance = axios.create({ baseURL: BASE_URL, timeout: TIMEOUT });

// Retry interceptor: on network error or 5xx, wait BACKOFF_DELAYS[attempt] then retry
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    config.__retryCount = (config.__retryCount ?? 0);
    const is5xx = error.response?.status >= 500;
    const isNetwork = !error.response;
    if ((is5xx || isNetwork) && config.__retryCount < MAX_RETRIES) {
      await sleep(BACKOFF_DELAYS[config.__retryCount]);
      config.__retryCount++;
      return axiosInstance(config);
    }
    return Promise.reject(error);
  }
);

// Normalizer: maps any settled result → { data, error, status }
function normalize(response) { /* ... */ }
function normalizeError(error) { /* ... */ }
```

### Exposed API Functions

| Function | Endpoint | Notes |
|---|---|---|
| `getUserInfo(handle)` | `GET /user.info?handles={handle}` | Returns `result[0]` |
| `getUserRating(handle)` | `GET /user.rating?handle={handle}` | Returns full result array |
| `getUserStatus(handle)` | `GET /user.status?handle={handle}&count=10000` | Max 10 000 submissions |
| `getProblemset()` | `GET /problemset.problems` | Returns `{ problems, problemStatistics }` |
| `getContestList()` | `GET /contest.list` | Returns all contest objects |

All five functions return `Promise<NormalizedResponse<T>>`. The normalization always produces `{ data, error, status }`. A 429 response additionally carries `retryAfter` parsed from the `Retry-After` response header.

### File: `src/services/index.js`

Re-exports all five API functions and the Axios instance for testability.

---

## Custom Hook Design (`src/hooks/useCodeforcesData.js`)

```
useCodeforcesData(handle)
  │
  ├── Effect [handle]
  │     ├── Read localStorage → CacheEntry or null
  │     ├── If cache hit (age < TTL=15min) → setAll(cached.data), return
  │     └── Otherwise:
  │           setLoading(true)
  │           results = await Promise.allSettled([
  │             getUserInfo(handle),
  │             getUserRating(handle),
  │             getUserStatus(handle),
  │             getProblemset(),
  │             getContestList()
  │           ])
  │           → parse each settled result
  │           → collect failed endpoint names
  │           → write to localStorage with timestamp
  │           setProfile / setContests / setSubmissions / setProblems
  │           setError(failedEndpoints.join(', ') or null)
  │           setLoading(false)
  │
  ├── refetch()  → clear localStorage key → re-run effect
  │
  └── Cleanup: AbortController signal to cancel in-flight fetch on handle change
```

### Cancellation Strategy

An `AbortController` is created at the start of each effect run. Its signal is passed through custom fetch wrappers. When `handle` changes (or the component unmounts), the cleanup function calls `controller.abort()`, preventing stale state updates.

### State Shape

```js
const [profile,     setProfile]     = useState(null);
const [contests,    setContests]    = useState(null);
const [submissions, setSubmissions] = useState(null);
const [problems,    setProblems]    = useState(null);
const [loading,     setLoading]     = useState(false);
const [error,       setError]       = useState(null);
```

---

## Page and Layout Components

### `src/pages/HomePage.jsx`

Renders the full-screen hero section. Contains:

- **Animated gradient background**: CSS `animate-pulse` + Framer Motion gradient shift.
- **`<SearchCard />`**: glassmorphism card containing the handle input, validation logic, and submit button. The "Analyze" button shows a spinner during navigation.
- **URL extraction**: `input.includes('codeforces.com/profile/') ? input.split('/profile/')[1]?.split('/')[0] : input`.
- **Validation**: regex `/^[a-zA-Z0-9_-]{1,24}$/` tested against the extracted handle.
- **Shake animation**: Framer Motion `x: [0, -8, 8, -8, 8, 0]` sequence on error.
- **Feature strip**: 6 `<FeatureHighlight icon label />` cards rendered in a flex row below the hero.

### `src/pages/DashboardPage.jsx` (lazy-loaded)

```jsx
const DashboardPage = React.lazy(() => import('./DashboardPage'));
// Wrapped in <Suspense fallback={<DashboardSkeleton />}> at the router level
```

Receives `handle` from `useParams()`, calls `useCodeforcesData(handle)`, computes `ComputedStats` via `useMemo`, and passes slices of data down as props to the 22 section components.

### `src/components/layout/Sidebar.jsx`

Visible only on `lg+` (Tailwind `hidden lg:flex`). 240 px wide, sticky. Contains:

- **User mini-card**: avatar thumbnail, handle, current rank badge.
- **Section nav links**: smooth-scroll `<a href="#section-id">` list; active section highlighted via IntersectionObserver.

### `src/components/layout/MobileNav.jsx`

Hamburger button fixed to the top-right on `< lg`. Opens a drawer with the same nav links as Sidebar.

### `src/components/layout/PageWrapper.jsx`

Provides the root `bg-gray-950 min-h-screen` container and the `<TopProgressBar />` overlay.

---

## All 22 Dashboard Section Components

Each section component lives under `src/components/` grouped by domain. Every section:
1. Accepts a narrow props slice (never the full hook return).
2. Is wrapped with `React.memo`.
3. Renders a Framer Motion `<motion.div>` with `initial={{ opacity:0, y:20 }}` `animate={{ opacity:1, y:0 }}`.
4. Uses the `<GlassCard>` primitive as its outer wrapper.

| # | Component | File | Key Props |
|---|---|---|---|
| 1 | ProfileCard | `components/ProfileCard.jsx` | `profile` |
| 2 | SummaryStats | `components/SummaryStats.jsx` | `contests` |
| 3 | RatingHistoryChart | `charts/RatingHistoryChart.jsx` | `contests` |
| 4 | RatingChangeChart | `charts/RatingChangeChart.jsx` | `contests` |
| 5 | ContestTable | `components/ContestTable.jsx` | `contests` |
| 6 | ContestAnalytics | `components/ContestAnalytics.jsx` | `contests` |
| 7 | SubmissionStats | `components/SubmissionStats.jsx` | `submissions` |
| 8 | LanguageBreakdown | `charts/LanguageBreakdown.jsx` | `submissions` |
| 9 | ProblemStats | `components/ProblemStats.jsx` | `submissions`, `problems` |
| 10 | TagAnalysis | `charts/TagAnalysis.jsx` | `submissions` |
| 11 | WeakTopics | `components/WeakTopics.jsx` | `submissions` |
| 12 | StrongTopics | `components/StrongTopics.jsx` | `submissions` |
| 13 | ActivityHeatmap | `components/ActivityHeatmap.jsx` | `submissions` |
| 14 | DailyActivityChart | `charts/DailyActivityChart.jsx` | `submissions` |
| 15 | MonthlyActivityChart | `charts/MonthlyActivityChart.jsx` | `submissions` |
| 16 | YearlyActivityChart | `charts/YearlyActivityChart.jsx` | `submissions` |
| 17 | VerdictDistribution | `charts/VerdictDistribution.jsx` | `submissions` |
| 18 | ProblemRatingDistribution | `charts/ProblemRatingDistribution.jsx` | `submissions`, `problems` |
| 19 | AiInsights | `components/AiInsights.jsx` | `stats` (ComputedStats) |
| 20 | PracticeRecommendations | `components/PracticeRecommendations.jsx` | `profile`, `submissions`, `problems` |
| 21 | Achievements | `components/Achievements.jsx` | `stats` |
| 22 | DownloadPdfButton | `components/DownloadPdfButton.jsx` | — |

---

## Chart Components (`src/charts/`)

All chart components use `react-chartjs-2`. All Chart.js components are registered globally in `main.jsx`:

```js
// src/main.jsx
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend,
  annotationPlugin, zoomPlugin
);
```

### Shared Chart Config (`src/utils/chartDefaults.js`)

```js
export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.7)' } },
    tooltip: { /* custom styled tooltip */ },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.6)' } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.6)' } },
  },
  animation: { duration: 600, easing: 'easeInOutQuart' },
};
```

### `RatingHistoryChart`
- **Type**: Line with area fill.
- **Gradient fill**: `ctx.createLinearGradient(0, 0, 0, height)` — accent color at top, transparent at bottom.
- **Annotations**: `chartjs-plugin-annotation` box annotations for each `RATING_BANDS` entry drawn behind the line.
- **Zoom/pan**: `chartjs-plugin-zoom` scroll-wheel zoom + click-drag pan.
- **Single-point guard**: if `contests.length === 1`, set `pointRadius: 8` and disable line rendering.
- **Tooltip callback**: returns `[ contestName, `Rating: ${rating}`, `Delta: ${formatDelta(delta)}` ]`.

### `RatingChangeChart`
- **Type**: Bar.
- **Dynamic colors**: `backgroundColor: contests.map(c => c.delta > 0 ? '#22c55e' : '#ef4444')`.
- **Horizontal scroll**: when `contests.length > 50`, set container `overflow-x: auto` and fix bar width at minimum 8 px via `barThickness`.

### `LanguageBreakdown` (two charts in one component)
- **Pie chart**: one slice per language, proportional to submission count.
- **Bar chart**: sorted descending, `indexAxis: 'y'` for horizontal bars, each bar labeled.

### `TagAnalysis`
- **Type**: Horizontal bar (`indexAxis: 'y'`).
- **Top 20 tags** sorted descending by solve count.
- **Inline data labels**: `chartjs-plugin-datalabels` or manual afterDraw plugin.

### `DailyActivityChart`
- **Type**: Bar. X-axis: Mon–Sun.

### `MonthlyActivityChart`
- **Type**: Line. X-axis: Jan–Dec.

### `YearlyActivityChart`
- **Type**: Bar. X-axis: distinct years from submission data.

### `VerdictDistribution`
- **Type**: Doughnut. One arc per verdict, colors from `VERDICT_COLORS` constant.

### `ProblemRatingDistribution`
- **Type**: Bar. Bins: 800, 900, …, 3500. Counts AC-only unique problems in each bin.

---

## Utility Functions and Stat Calculators (`src/utils/`)

### `src/utils/statCalculators.js`

```js
// All functions are pure — no side effects

computeConsistencyScore(ratingChanges: number[]): number | null
  // Returns 1 - (stddev(changes) / mean(abs(changes)))
  // Returns null when mean(abs(changes)) === 0

computeContestStats(contests: CFRatingChange[]): ContestStats
  // Returns { total, avgRank, medianRank, bestRank, worstRank, largestGain, largestDrop, consistencyScore }

computeSubmissionStats(submissions: CFSubmission[]): SubmissionStats
  // Counts by verdict; "Other" = everything not in [AC,WA,TLE,MLE,RE,CE]

computeUniqueSolved(submissions: CFSubmission[]): Set<string>
  // Returns Set of "contestId-index" strings for AC submissions

computeTagCounts(submissions: CFSubmission[]): Map<string, number>
  // Deduplicates problems then counts tags

computeDifficultyStats(submissions: CFSubmission[]): { avg: number|null, max: number|null }

computeLanguageStats(submissions: CFSubmission[]): Map<string, number>

computeHeatmapData(submissions: CFSubmission[]): { date: string, count: number }[]
  // Only AC submissions, grouped by yyyy-MM-dd

computeActivityByDow(submissions: CFSubmission[]): number[7]
  // Index 0=Monday, 6=Sunday

computeActivityByMonth(submissions: CFSubmission[]): number[12]

computeActivityByYear(submissions: CFSubmission[]): Map<number, number>

computeComputedStats(profile, contests, submissions, problems): ComputedStats
```

### `src/utils/problemBinner.js`

```js
BINS = [800, 900, 1000, ..., 3500]

binByRating(problems: CFProblem[], solvedSet: Set<string>): number[]
  // Returns array of 28 counts (one per 100-pt bin from 800 to 3500)
```

### `src/utils/recommendations.js`

```js
getRecommendations(
  problems: CFProblem[],
  solvedSet: Set<string>,
  currentRating: number,
  weakTags: string[],
  limit: number = 20
): CFProblem[]
  // Excludes solved, filters ±200 rating, sorts by weak-tag overlap descending
```

### `src/utils/insightGenerator.js`

```js
generateInsights(stats: ComputedStats): Insight[]
  // Returns array of >= 10 { icon, text } objects
  // Insight topics: rating trend, top language, weakest tag, strongest tag,
  // submission frequency, consistency score, avg difficulty, highest difficulty,
  // most active day of week, contest win rate, solve rate improvement, etc.
```

### `src/utils/formatters.js`

```js
formatDelta(n: number): string
  // Returns "+N" for n > 0, "−N" for n <= 0

formatDate(timestampSeconds: number, pattern: string): string
  // Wraps date-fns format(new Date(ts * 1000), pattern)

daysAgo(timestampSeconds: number): number
  // date-fns differenceInDays(new Date(), new Date(ts * 1000))

formatContestDate(timestampSeconds: number): string
  // Returns "MMM yyyy"

formatFullDate(timestampSeconds: number): string
  // Returns "MMM d, yyyy"
```

### `src/utils/validators.js`

```js
HANDLE_REGEX = /^[a-zA-Z0-9_-]{1,24}$/

validateHandle(input: string): { valid: boolean; error: string | null }

extractHandle(input: string): string
  // If input contains "codeforces.com/profile/", split and extract
  // Otherwise return input as-is
```

---

## Constants (`src/constants/`)

### `src/constants/rankColors.js`

```js
export const RANK_COLORS = {
  'newbie':                '#808080',
  'pupil':                 '#008000',
  'specialist':            '#03A89E',
  'expert':                '#0000FF',
  'candidate master':      '#AA00AA',
  'master':                '#FF8C00',
  'international master':  '#FF8C00',
  'grandmaster':           '#FF0000',
  'international grandmaster': '#FF0000',
  'legendary grandmaster': '#FF0000',
};
```

### `src/constants/ratingBands.js`

```js
export const RATING_BANDS = [
  { label: 'Newbie',               min: 0,    max: 1199, color: 'rgba(128,128,128,0.15)' },
  { label: 'Pupil',                min: 1200, max: 1399, color: 'rgba(0,128,0,0.15)'     },
  { label: 'Specialist',           min: 1400, max: 1599, color: 'rgba(3,168,158,0.15)'   },
  { label: 'Expert',               min: 1600, max: 1899, color: 'rgba(0,0,255,0.15)'     },
  { label: 'Candidate Master',     min: 1900, max: 2099, color: 'rgba(170,0,170,0.15)'   },
  { label: 'Master',               min: 2100, max: 2299, color: 'rgba(255,140,0,0.15)'   },
  { label: 'International Master', min: 2300, max: 2399, color: 'rgba(255,140,0,0.15)'   },
  { label: 'Grandmaster',          min: 2400, max: 2599, color: 'rgba(255,0,0,0.15)'     },
  { label: 'IGM',                  min: 2600, max: 2999, color: 'rgba(255,0,0,0.15)'     },
  { label: 'LGM',                  min: 3000, max: 9999, color: 'rgba(255,0,0,0.2)'      },
];
```

### `src/constants/badges.js`

```js
export const BADGE_DEFINITIONS = [
  { id: 'first_ac',       label: 'First AC',           icon: StarIcon,    condition: s => s.totalAC >= 1        },
  { id: 'ac_10',          label: '10 ACs',              icon: FireIcon,    condition: s => s.totalAC >= 10       },
  { id: 'ac_50',          label: '50 ACs',              icon: FireIcon,    condition: s => s.totalAC >= 50       },
  { id: 'ac_100',         label: '100 ACs',             icon: TrophyIcon,  condition: s => s.totalAC >= 100      },
  { id: 'ac_500',         label: '500 ACs',             icon: TrophyIcon,  condition: s => s.totalAC >= 500      },
  { id: 'ac_1000',        label: '1000 ACs',            icon: TrophyIcon,  condition: s => s.totalAC >= 1000     },
  { id: 'first_contest',  label: 'First Contest',       icon: FlagIcon,    condition: s => s.totalContests >= 1  },
  { id: 'contest_10',     label: '10 Contests',         icon: FlagIcon,    condition: s => s.totalContests >= 10 },
  { id: 'contest_50',     label: '50 Contests',         icon: FlagIcon,    condition: s => s.totalContests >= 50 },
  // One badge per rank tier
  { id: 'rank_pupil',     label: 'Pupil',               icon: RankIcon,    condition: s => s.maxRating >= 1200   },
  { id: 'rank_specialist',label: 'Specialist',          icon: RankIcon,    condition: s => s.maxRating >= 1400   },
  // … through legendary grandmaster
];
```

### `src/constants/verdicts.js`

```js
export const VERDICT_COLORS = {
  AC:    '#22c55e',
  WA:    '#ef4444',
  TLE:   '#f59e0b',
  MLE:   '#8b5cf6',
  RE:    '#f97316',
  CE:    '#06b6d4',
  Other: '#6b7280',
};

export const KNOWN_VERDICTS = ['AC','WA','TLE','MLE','RE','CE'];
```

### `src/constants/tags.js`

A `TAG_LIST` array of at least 35 strings: `['dp', 'graphs', 'greedy', 'binary search', 'math', 'data structures', 'constructive algorithms', 'brute force', 'implementation', 'sortings', 'number theory', 'strings', 'dfs and similar', 'trees', 'combinatorics', 'bitmasks', 'two pointers', 'dsu', 'shortest paths', 'flows', 'games', 'geometry', 'hashing', 'probabilities', 'string suffix structures', 'matrices', 'fft', 'ternary search', 'expression parsing', 'meet-in-the-middle', '2-sat', 'chinese remainder theorem', 'convex hull', 'schedules', 'divide and conquer', 'interactive', /* more */ ]`

---

## Routing (`src/App.jsx`)

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import HomePage from './pages/HomePage';
import DashboardSkeleton from './components/ui/DashboardSkeleton';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/user/:handle"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

Navigation from Homepage: `useNavigate()` called with `navigate(`/user/${handle}`)` on valid form submission.

---

## State Management Approach

No external state management library (no Redux, no Zustand). State is co-located:

- **Global data state**: `useCodeforcesData` hook — lives at `DashboardPage`, passed as props.
- **Derived/computed state**: `useMemo` calls inside `DashboardPage` and individual section components.
- **UI state** (sort column, page index, sidebar open): `useState` inside the component that owns it.
- **No prop drilling beyond 2 levels**: `DashboardPage` computes `ComputedStats` and passes it to `AiInsights`, `Achievements`, and `PracticeRecommendations` directly.

### Rationale

The data model is a simple fetch-once-then-compute pattern. No mutations, no optimistic updates. A shared custom hook with `useMemo`-derived slices is sufficient without the overhead of a global store.

---

## Caching Strategy

```
Key:   "cf_insights_{handle_lowercase}"
Value: JSON.stringify({ timestamp: Date.now(), ttl: 900_000, data: { profile, contests, submissions, problems } })
TTL:   900_000 ms (15 minutes)
```

### Cache Read Logic

```js
function readCache(handle) {
  const raw = localStorage.getItem(`cf_insights_${handle.toLowerCase()}`);
  if (!raw) return null;
  const entry = JSON.parse(raw);
  if (Date.now() - entry.timestamp > entry.ttl) {
    localStorage.removeItem(`cf_insights_${handle.toLowerCase()}`);
    return null;
  }
  return entry.data;
}
```

### Cache Write Logic

```js
function writeCache(handle, data) {
  const entry = { timestamp: Date.now(), ttl: 900_000, data };
  localStorage.setItem(`cf_insights_${handle.toLowerCase()}`, JSON.stringify(entry));
}
```

### Cache Invalidation

`refetch()` calls `localStorage.removeItem(key)` then re-runs the fetch effect. The 429 error path does NOT write to cache (rate-limited data is stale by definition).

---

## Performance Patterns

### React.memo

Every chart component and every dashboard section component is wrapped with `React.memo`. Since props are derived from `useMemo`, reference equality holds between renders, preventing unnecessary re-renders.

```jsx
export default React.memo(RatingHistoryChart);
export default React.memo(TagAnalysis);
// … all 22 section components
```

### useMemo

All expensive stat computations live in `DashboardPage`:

```jsx
const contestStats   = useMemo(() => computeContestStats(contests),     [contests]);
const submissionStats = useMemo(() => computeSubmissionStats(submissions), [submissions]);
const uniqueSolved   = useMemo(() => computeUniqueSolved(submissions),  [submissions]);
const tagCounts      = useMemo(() => computeTagCounts(submissions),     [submissions]);
const heatmapData    = useMemo(() => computeHeatmapData(submissions),   [submissions]);
const computedStats  = useMemo(
  () => computeComputedStats(profile, contests, submissions, problems),
  [profile, contests, submissions, problems]
);
const recommendations = useMemo(
  () => getRecommendations(problems, uniqueSolved, profile?.rating, computedStats.weakTags),
  [problems, uniqueSolved, profile, computedStats.weakTags]
);
```

### useCallback

All event handlers (sort, page change, refetch, print) are wrapped:

```jsx
const handleSort    = useCallback((col, dir) => { /* ... */ }, []);
const handlePageChange = useCallback((page) => { /* ... */ }, []);
const handleRefetch = useCallback(() => refetch(), [refetch]);
const handlePrint   = useCallback(() => window.print(), []);
```

### React.lazy + Suspense

`DashboardPage` is code-split so the homepage bundle does not include chart libraries.

### react-window Virtualization

`ContestTable` uses `react-window`'s `FixedSizeList` when `contests.length > 100`:

```jsx
import { FixedSizeList as List } from 'react-window';

// Row height: 48px, visible rows: 20
<List height={960} itemCount={sortedContests.length} itemSize={48} width="100%">
  {({ index, style }) => (
    <ContestRow key={index} style={style} contest={sortedContests[index]} />
  )}
</List>
```

---

## Error Handling Patterns

### Error Hierarchy

```
Network Error
  → toast notification + Retry button
  → sets error state in useCodeforcesData

HTTP 400
  → "No user found" full-page error card with "Search Again" CTA
  → navigate back to "/"

HTTP 429
  → displays countdown timer (Retry-After seconds)
  → disables Retry button until countdown reaches 0

Partial failure (some endpoints succeed)
  → render all available sections
  → <WarningBanner failedEndpoints={[...]} /> at top of dashboard

All endpoints fail
  → full-page "Network Error" card with Retry button
```

### `<ErrorBoundary>` Usage

Each major section is wrapped in a React Error Boundary (`src/components/ui/ErrorBoundary.jsx`). If a section's rendering throws, it shows a "Section unavailable" fallback card instead of crashing the whole dashboard.

### `<RateLimitTimer>` Component

When `error` includes a 429, extracts `retryAfter` from hook state and renders a countdown:

```jsx
// Counts down from retryAfter seconds, then enables the retry button
const [seconds, setSeconds] = useState(retryAfter);
useEffect(() => {
  if (seconds <= 0) return;
  const timer = setInterval(() => setSeconds(s => s - 1), 1000);
  return () => clearInterval(timer);
}, [seconds]);
```

### Empty States

Each section that can receive zero-length data arrays has an `<EmptyState illustration text />` component rendered via a guard:

```jsx
if (!submissions || submissions.length === 0) return <EmptyState text="No submissions yet." />;
```

---

## Framer Motion Animation Strategy

### Entrance Animations

Every section uses a shared `fadeSlideUp` variant:

```js
// src/utils/motionVariants.js
export const fadeSlideUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};
```

Usage in sections:

```jsx
<motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
  <GlassCard>…</GlassCard>
</motion.div>
```

For grids of cards (e.g., SummaryStats, Achievements):

```jsx
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {cards.map(card => (
    <motion.div key={card.id} variants={fadeSlideUp}>
      <StatCard {...card} />
    </motion.div>
  ))}
</motion.div>
```

### Shake Animation (validation errors)

```js
export const shake = {
  x: [0, -8, 8, -8, 8, 0],
  transition: { duration: 0.4 },
};
```

Applied via `animate={hasError ? shake : {}}`.

### Count-Up Animation (`<AnimatedNumber>`)

Implemented with Framer Motion's `useMotionValue` and `useTransform`:

```jsx
// Interpolates from 0 to target over 1000 ms
const motionVal = useMotionValue(0);
useEffect(() => {
  animate(motionVal, target, { duration: 1, ease: 'linear' });
}, [target]);
const rounded = useTransform(motionVal, v => Math.round(v).toLocaleString());
return <motion.span>{rounded}</motion.span>;
```

---

## Print / PDF Stylesheet Approach

A dedicated `src/styles/print.css` is imported in `main.jsx`. No external PDF library is used — the browser's print dialog produces the PDF.

```css
@media print {
  /* Hide interactive elements */
  .sidebar, .mobile-nav, .top-progress-bar,
  .download-pdf-btn, .retry-btn, .zoom-controls {
    display: none !important;
  }

  /* Full-width single-column layout */
  .dashboard-grid {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }

  /* White background, dark text */
  body, .dashboard-root {
    background: #ffffff !important;
    color: #000000 !important;
  }

  /* Glass cards become plain white boxes */
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    backdrop-filter: none !important;
    box-shadow: none !important;
  }

  /* Ensure charts print at correct size */
  canvas {
    max-width: 100% !important;
    height: auto !important;
  }

  /* Page breaks between major sections */
  .dashboard-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

The "Download as PDF" button calls `window.print()`. Users choose "Save as PDF" in the browser's print dialog.

---

## Folder Structure

```
src/
├── main.jsx                       # Vite entry; Chart.js global registration; CSS imports
├── App.jsx                        # Router + lazy DashboardPage
│
├── constants/
│   ├── rankColors.js              # RANK_COLORS (Req 28.1)
│   ├── ratingBands.js             # RATING_BANDS (Req 28.4)
│   ├── badges.js                  # BADGE_DEFINITIONS (Req 28.3)
│   ├── tags.js                    # TAG_LIST 35+ tags (Req 28.2)
│   └── verdicts.js                # VERDICT_COLORS, KNOWN_VERDICTS
│
├── services/
│   ├── apiClient.js               # Axios instance + retry interceptor
│   └── index.js                   # getUserInfo, getUserRating, getUserStatus, getProblemset, getContestList
│
├── hooks/
│   └── useCodeforcesData.js       # Data hook with caching + refetch (Req 2)
│
├── utils/
│   ├── statCalculators.js         # All pure stat computation functions
│   ├── problemBinner.js           # binByRating()
│   ├── recommendations.js         # getRecommendations()
│   ├── insightGenerator.js        # generateInsights()
│   ├── formatters.js              # formatDelta, formatDate, daysAgo, etc.
│   ├── validators.js              # validateHandle, extractHandle
│   ├── chartDefaults.js           # Shared Chart.js config object
│   └── motionVariants.js          # Framer Motion variants
│
├── pages/
│   ├── HomePage.jsx               # Hero + search card (Req 3)
│   └── DashboardPage.jsx          # Full dashboard (lazy-loaded) (Req 5)
│
├── components/
│   ├── ui/
│   │   ├── GlassCard.jsx          # bg-white/5 backdrop-blur card wrapper
│   │   ├── Button.jsx             # Styled button variants (primary, ghost)
│   │   ├── Badge.jsx              # Inline badge with color prop
│   │   ├── Skeleton.jsx           # Animated skeleton placeholder blocks
│   │   ├── Tooltip.jsx            # Hover tooltip primitive
│   │   ├── EmptyState.jsx         # Illustration + message for empty data
│   │   ├── ErrorBoundary.jsx      # React error boundary
│   │   ├── AnimatedNumber.jsx     # Count-up number animation
│   │   ├── TopProgressBar.jsx     # Fixed loading bar (Req 4.5)
│   │   └── DashboardSkeleton.jsx  # Full-page skeleton for Suspense fallback
│   │
│   ├── layout/
│   │   ├── Sidebar.jsx            # lg+ sticky nav sidebar (Req 5.1)
│   │   ├── MobileNav.jsx          # Hamburger drawer < lg (Req 5.2)
│   │   ├── PageWrapper.jsx        # Root bg-gray-950 container
│   │   └── SectionHeader.jsx     # Gradient text section titles (Req 5.7)
│   │
│   ├── ProfileCard.jsx            # Req 6
│   ├── SummaryStats.jsx           # Req 7
│   ├── ContestTable.jsx           # Req 10 (react-window when >100 rows)
│   ├── ContestAnalytics.jsx       # Req 11
│   ├── SubmissionStats.jsx        # Req 12
│   ├── ProblemStats.jsx           # Req 14
│   ├── WeakTopics.jsx             # Req 16
│   ├── StrongTopics.jsx           # Req 17
│   ├── ActivityHeatmap.jsx        # Req 18
│   ├── AiInsights.jsx             # Req 22
│   ├── PracticeRecommendations.jsx # Req 23
│   ├── Achievements.jsx           # Req 24
│   ├── DownloadPdfButton.jsx      # Req 25
│   ├── WarningBanner.jsx          # Partial failure warning (Req 26.5)
│   └── RateLimitTimer.jsx         # 429 countdown (Req 26.3)
│
├── charts/
│   ├── RatingHistoryChart.jsx     # Req 8 — Line + gradient + annotations + zoom
│   ├── RatingChangeChart.jsx      # Req 9 — Bar + color by delta
│   ├── LanguageBreakdown.jsx      # Req 13 — Pie + horizontal bar
│   ├── TagAnalysis.jsx            # Req 15 — Horizontal bar top 20 tags
│   ├── DailyActivityChart.jsx     # Req 19 — Bar by day-of-week
│   ├── MonthlyActivityChart.jsx   # Req 19 — Line by month
│   ├── YearlyActivityChart.jsx    # Req 19 — Bar by year
│   ├── VerdictDistribution.jsx    # Req 20 — Doughnut
│   └── ProblemRatingDistribution.jsx # Req 21 — Histogram 800–3500
│
└── styles/
    ├── index.css                  # Tailwind base + custom utilities
    └── print.css                  # @media print overrides (Req 25)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Retry backoff schedule

*For any* sequence of consecutive request failures (0–3 failures before a success or all 3 exhausted), the API client SHALL wait exactly `BACKOFF_DELAYS[attempt]` milliseconds before each retry attempt, and SHALL NOT issue more than 3 retry attempts.

**Validates: Requirements 1.3, 1.4**

---

### Property 2: Normalized response shape

*For any* API call outcome (success with any status code, network error, or timeout), the returned object SHALL have exactly the fields `{ data, error, status }` where `data` is `null` or a parsed object, `error` is `null` or a non-empty string, and `status` is a number.

**Validates: Requirements 1.10**

---

### Property 3: All five endpoints called in parallel

*For any* non-empty handle string, calling `useCodeforcesData(handle)` SHALL invoke all five API functions (`getUserInfo`, `getUserRating`, `getUserStatus`, `getProblemset`, `getContestList`) exactly once.

**Validates: Requirements 2.1**

---

### Property 4: Loading lifecycle invariant

*For any* combination of API responses (all succeed, partial success, all fail), the hook SHALL start with `loading === true` and SHALL eventually set `loading === false` after all promises have settled.

**Validates: Requirements 2.3, 2.4**

---

### Property 5: Cache key format

*For any* handle string, the localStorage key used by the hook SHALL equal `"cf_insights_" + handle.toLowerCase()`.

**Validates: Requirements 2.5**

---

### Property 6: Cache freshness gate

*For any* cached entry whose age (in milliseconds since `entry.timestamp`) is strictly less than 900 000 ms, calling `useCodeforcesData` with the same handle SHALL return the cached data and SHALL NOT call any of the five API functions.

**Validates: Requirements 2.6**

---

### Property 7: Partial failure populates available fields

*For any* subset of failing API endpoints (1 to 4 out of 5), the hook SHALL populate the data fields corresponding to the succeeding endpoints with non-null values, and SHALL set `error` to a string containing the names of the failing endpoints.

**Validates: Requirements 2.8, 2.9**

---

### Property 8: Cache round-trip fidelity

*For any* valid `CodeforcesData` object, serializing it to localStorage via `writeCache` and then reading it back via `readCache` SHALL produce a deeply-equal object.

**Validates: Requirements 2.11**

---

### Property 9: URL handle extraction

*For any* string of the form `https://codeforces.com/profile/{handle}` or `codeforces.com/profile/{handle}` (with any arbitrary path suffix), `extractHandle(url)` SHALL return exactly the handle segment without leading or trailing slashes.

**Validates: Requirements 3.3, 3.4**

---

### Property 10: Handle validation rejects invalid characters

*For any* string containing at least one character that is not alphanumeric, underscore, or hyphen, `validateHandle(str).valid` SHALL return `false`.

**Validates: Requirements 3.6**

---

### Property 11: Delta formatting is total and correct

*For any* integer `n`, `formatDelta(n)` SHALL return a string starting with "+" when `n > 0` and starting with "−" when `n ≤ 0`, with the absolute value of `n` as the numeric portion.

**Validates: Requirements 8.4, 9.2, 9.3**

---

### Property 12: Bar color is determined by delta sign

*For any* numeric delta value `d`, the color assigned to the corresponding chart bar SHALL be `#22c55e` when `d > 0` and `#ef4444` when `d ≤ 0`.

**Validates: Requirements 9.2, 9.3**

---

### Property 13: Contest sort order

*For any* array of contest objects and any sortable column (`date`, `rank`, `oldRating`, `newRating`, `delta`), calling `sortContests(contests, column, direction)` SHALL return an array where every element satisfies the comparison predicate for `direction` relative to its successor.

**Validates: Requirements 10.2**

---

### Property 14: Consistency score formula

*For any* non-empty array of rating change integers whose absolute mean is greater than zero, `computeConsistencyScore(changes)` SHALL equal `1 - (stddev(changes) / mean(abs(changes)))` rounded to 2 decimal places.

**Validates: Requirements 11.2**

---

### Property 15: Verdict counts sum to total submissions

*For any* array of submissions, the sum of all individual verdict counts produced by `computeSubmissionStats` (including "Other") SHALL equal the total number of submissions in the input array.

**Validates: Requirements 12.1**

---

### Property 16: Unique solved count cannot exceed total AC count

*For any* array of submissions, `computeUniqueSolved(submissions).size` SHALL be less than or equal to the total number of AC submissions.

**Validates: Requirements 14.1**

---

### Property 17: Rating bin assignment is total and exclusive

*For any* integer problem rating in [800, 3500], `binByRating` SHALL assign the problem to exactly one bin, and the bin boundaries SHALL be consistent with 100-point intervals.

**Validates: Requirements 14.2, 21.1**

---

### Property 18: Tag counts do not exceed unique problem count

*For any* array of submissions containing duplicate `problemId` entries, the solve count for any single tag produced by `computeTagCounts` SHALL be less than or equal to the number of unique solved problems.

**Validates: Requirements 15.1**

---

### Property 19: Heatmap uses only AC submissions with correct date format

*For any* array of submissions, every entry in the heatmap data returned by `computeHeatmapData` SHALL correspond to an AC submission, and every date string SHALL match the pattern `yyyy-MM-dd`.

**Validates: Requirements 18.2**

---

### Property 20: AI insights count is at least 10

*For any* valid `ComputedStats` object (even when all numeric fields are zero or null), `generateInsights(stats)` SHALL return an array of length greater than or equal to 10.

**Validates: Requirements 22.1**

---

### Property 21: Recommendations exclude solved problems and respect rating window

*For any* problemset, solved set, and current rating, every problem returned by `getRecommendations` SHALL NOT appear in the solved set AND SHALL have a rating within [currentRating − 200, currentRating + 200].

**Validates: Requirements 23.1, 23.2**

---

### Property 22: Badge evaluation is consistent with condition function

*For any* `ComputedStats` object and any badge in `BADGE_DEFINITIONS`, the badge's `unlocked` state SHALL equal the boolean result of calling `badge.condition(stats)`.

**Validates: Requirements 24.1, 24.2, 24.3**

---

## Error Handling

### Error Type Matrix

| Condition | UI Response | Recovery Action |
|---|---|---|
| 400 from `/user.info` | "No user found" card | "Search Again" → navigate("/") |
| Network timeout / error | Toast + Retry button | `refetch()` |
| HTTP 429 | Countdown timer (Retry-After seconds) | Auto-enable Retry when timer reaches 0 |
| Partial API failure | Warning banner listing failed endpoints | Manual Retry button |
| All 5 endpoints fail | Full-page "Network Error" card | Retry button |
| Zero contests / submissions | Per-section empty-state illustration | None |
| Component render error | Per-section "Section unavailable" card (ErrorBoundary) | None |
| localStorage quota exceeded | Silently skip cache write; log warning | None |

### Error Normalization

All errors flowing through the API client are normalized before reaching the hook:

```
Axios network error → { data: null, error: "Network error. Check your connection.", status: 0 }
HTTP 4xx (not 400/429) → { data: null, error: "Unexpected API error (status: N).", status: N }
HTTP 400 → { data: null, error: "User not found. Check the handle.", status: 400 }
HTTP 429 → { data: null, error: "Rate limited.", status: 429, retryAfter: N }
HTTP 5xx → retried 3 times, then → { data: null, error: "Server error after 3 retries.", status: N }
```

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

Target the pure utility functions and hook logic with example-based and property-based tests.

**Specific example tests**:
- `apiClient.js`: mock Axios, verify each function calls the correct endpoint.
- `validators.js`: known valid and invalid handle strings.
- `formatters.js`: specific date/delta formatting examples.
- `ContestTable`: render with mock data, click header, verify sort, paginate.
- `HomePage`: submit empty input, verify error; submit valid handle, verify navigation.
- `DashboardSkeleton`: render with `loading=true`, verify skeleton count.

### Property-Based Tests (fast-check)

Use [fast-check](https://github.com/dubzzz/fast-check) for the 22 correctness properties identified above. Each property test:
- Runs a minimum of **100 iterations**.
- Is tagged with a comment: `// Feature: codeforces-insights, Property N: <property text>`
- Lives in `src/__tests__/properties/` with one file per property domain.

**Example property test structure**:

```js
// Feature: codeforces-insights, Property 15: Verdict counts sum to total submissions
import fc from 'fast-check';
import { computeSubmissionStats } from '../utils/statCalculators';

test('verdict counts sum to total', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ verdict: fc.string() })),
      submissions => {
        const stats = computeSubmissionStats(submissions);
        const sum = Object.values(stats.verdictCounts).reduce((a, b) => a + b, 0);
        return sum === submissions.length;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property test files**:
- `properties/apiClient.property.test.js` — Properties 1, 2
- `properties/dataHook.property.test.js` — Properties 3, 4, 5, 6, 7, 8
- `properties/validators.property.test.js` — Properties 9, 10
- `properties/formatters.property.test.js` — Property 11, 12
- `properties/statCalculators.property.test.js` — Properties 13, 14, 15, 16, 17, 18, 19, 20
- `properties/recommendations.property.test.js` — Property 21
- `properties/achievements.property.test.js` — Property 22

### Integration Tests

- Mount `DashboardPage` with mocked `useCodeforcesData` returning fixture data; verify all 22 sections render.
- Test the 429 countdown timer with fake timers.
- Test the cache TTL boundary with mocked `Date.now`.

### Visual Regression (optional)

Storybook stories for each chart component + Chromatic snapshots ensure chart rendering doesn't regress.
