# Implementation Plan: Codeforces Insights

## Overview

Build a fully client-side React 19 + Vite SPA that fetches Codeforces data and renders a rich analytics dashboard. Tasks are ordered so each step compiles and runs on its own before the next begins. No task writes to the same file as another in the same wave.

---

## Tasks

- [x] 1. Project scaffold — Vite + React 19, dependencies, Tailwind, folder structure
  - Run `npm create vite@latest . -- --template react` (React 19 template)
  - Install all runtime deps: `axios react-router-dom chart.js react-chartjs-2 chartjs-plugin-annotation chartjs-plugin-zoom chartjs-plugin-datalabels react-calendar-heatmap react-window framer-motion date-fns @heroicons/react`
  - Install all dev deps: `tailwindcss @tailwindcss/vite vitest @vitest/ui @testing-library/react @testing-library/jest-dom fast-check jsdom`
  - Configure Tailwind v4 via `@tailwindcss/vite` plugin in `vite.config.js`
  - Create the full folder tree: `src/constants/`, `src/services/`, `src/hooks/`, `src/utils/`, `src/pages/`, `src/components/ui/`, `src/components/layout/`, `src/charts/`, `src/styles/`, `src/__tests__/properties/`
  - Add `vitest.config.js` with jsdom environment and setupFiles pointing to a test-setup file
  - _Requirements: 29.1–29.8_

- [ ] 5. Custom hook `useCodeforcesData`
  - [ ] 5.1 Create `src/hooks/useCodeforcesData.js`
    - Implement state: `{ profile, contests, submissions, problems, loading, error }`
    - On mount and handle change: read `localStorage` key `cf_insights_{handle.toLowerCase()}`, return cached data if age < 900 000 ms
    - On cache miss: set `loading=true`, call `Promise.allSettled` with all 5 API functions, normalize settled results
    - Populate available fields from fulfilled promises; collect failed endpoint names into `error` string
    - Write successful fetch to `localStorage` with `{ timestamp, ttl: 900_000, data }`
    - Set `loading=false` after all promises settle
    - Implement `refetch()` that removes the cache key and re-runs the effect
    - Create `AbortController` per effect run; abort on handle change or unmount
    - _Requirements: 2.1–2.10_
  - [ ]* 5.2 Write property tests for data hook — Properties 3–8
    - Create `src/__tests__/properties/dataHook.property.test.js`
    - **Property 3: All five endpoints called in parallel** — for any non-empty handle, all 5 API functions are invoked exactly once; **Validates: Requirements 2.1**
    - **Property 4: Loading lifecycle invariant** — for any combination of responses, hook starts with `loading=true` and ends with `loading=false`; **Validates: Requirements 2.3, 2.4**
    - **Property 5: Cache key format** — for any handle, key equals `"cf_insights_" + handle.toLowerCase()`; **Validates: Requirements 2.5**
    - **Property 6: Cache freshness gate** — for cached entry with age < 900 000 ms, no API functions are called; **Validates: Requirements 2.6**
    - **Property 7: Partial failure populates available fields** — for any 1–4 failing endpoints, succeeding fields are non-null and error lists failed endpoints; **Validates: Requirements 2.8, 2.9**
    - **Property 8: Cache round-trip fidelity** — write then read from localStorage produces deeply-equal object; **Validates: Requirements 2.11**
    - _Requirements: 2.1, 2.3–2.6, 2.8, 2.9, 2.11_

- [ ] 6. Checkpoint — Core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. UI Primitive Components (`src/components/ui/`)
  - [ ] 7.1 Create `GlassCard.jsx` — wrapper with `bg-white/5 backdrop-blur-md border border-white/10` and optional className prop
    - _Requirements: 5.6_
  - [ ] 7.2 Create `Button.jsx` — primary and ghost variants; supports `loading` prop showing spinner; `disabled` prop
    - _Requirements: 3.8, 25.1_
  - [ ] 7.3 Create `Badge.jsx` — inline badge accepting `color`, `label`, `size` props
    - _Requirements: 17.1, 13.3_
  - [ ] 7.4 Create `Skeleton.jsx` — rectangular placeholder with `animate-pulse`; accepts `width`, `height`, `className`
    - _Requirements: 4.4_
  - [ ] 7.5 Create `Tooltip.jsx` — hover tooltip wrapping children; positions above/below based on available space
    - _Requirements: 8.4, 9.4, 18.3_
  - [ ] 7.6 Create `EmptyState.jsx` — centered illustration placeholder with configurable `text` prop
    - _Requirements: 11.3, 12.3, 13.5, 14.4, 26.4_
  - [ ] 7.7 Create `ErrorBoundary.jsx` — React class ErrorBoundary showing `"Section unavailable"` fallback card on error
    - _Requirements: 26.1–26.5_
  - [ ] 7.8 Create `AnimatedNumber.jsx` — count-up from 0 to `target` over 1000 ms using Framer Motion `useMotionValue` + `animate`
    - _Requirements: 7.3_
  - [ ] 7.9 Create `TopProgressBar.jsx` — fixed-position, full-width bar animating left-to-right while `loading=true`; disappears when loading ends
    - _Requirements: 4.5, 4.6_
  - [ ] 7.10 Create `DashboardSkeleton.jsx` — full-page skeleton: avatar circle + 4 text lines, 4 stat card skeletons, 2 chart skeletons at 16:9 ratio, all with `animate-pulse`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Constants — rank colors, rating bands, badges, tags, verdicts
  - [-] 2.1 Create `src/constants/rankColors.js` exporting `RANK_COLORS` mapping all 10 Codeforces rank tiers to hex values
    - _Requirements: 28.1_
  - [-] 2.2 Create `src/constants/ratingBands.js` exporting `RATING_BANDS` array with `{ label, min, max, color }` for all 10 tiers
    - _Requirements: 28.4_
  - [-] 2.3 Create `src/constants/verdicts.js` exporting `VERDICT_COLORS` map and `KNOWN_VERDICTS` array
    - Verdicts: AC, WA, TLE, MLE, RE, CE, Other with distinct predefined hex colors
    - _Requirements: 12.4_
  - [-] 2.4 Create `src/constants/tags.js` exporting `TAG_LIST` with at least 35 common Codeforces problem tags
    - _Requirements: 28.2_
  - [ ] 2.5 Create `src/constants/badges.js` exporting `BADGE_DEFINITIONS` array of `{ id, label, icon, condition(stats) }` objects
    - Include badges for: First AC, 10/50/100/500/1000 ACs, First Contest, 10/50 Contests, and one badge per rank tier reached
    - Import icons from `@heroicons/react/24/solid`
    - _Requirements: 28.3, 24.4_

- [ ] 3. Utility functions
  - [ ] 3.1 Create `src/utils/formatters.js` with `formatDelta`, `formatDate`, `daysAgo`, `formatContestDate`, `formatFullDate`
    - `formatDelta(n)`: returns `"+N"` for n > 0, `"−N"` for n ≤ 0
    - `formatDate(ts, pattern)`: wraps date-fns `format(new Date(ts * 1000), pattern)`
    - `daysAgo(ts)`: uses date-fns `differenceInDays`
    - `formatContestDate(ts)`: returns `"MMM yyyy"`
    - `formatFullDate(ts)`: returns `"MMM d, yyyy"`
    - _Requirements: 6.4, 6.5, 8.1_
  - [ ]* 3.2 Write property test for `formatDelta` — Property 11
    - **Property 11: Delta formatting is total and correct**
    - **Validates: Requirements 8.4, 9.2, 9.3**
    - File: `src/__tests__/properties/formatters.property.test.js`
    - Use fast-check `fc.integer()` to generate arbitrary n; assert prefix sign and absolute value
  - [ ] 3.3 Create `src/utils/validators.js` with `HANDLE_REGEX`, `validateHandle(input)`, and `extractHandle(input)`
    - `validateHandle`: returns `{ valid: boolean, error: string | null }`
    - `extractHandle`: splits on `codeforces.com/profile/` if present, otherwise returns input as-is
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_
  - [ ]* 3.4 Write property tests for validators — Properties 9 and 10
    - **Property 9: URL handle extraction**
    - **Property 10: Handle validation rejects invalid characters**
    - **Validates: Requirements 3.3, 3.4, 3.6**
    - File: `src/__tests__/properties/validators.property.test.js`
  - [ ] 3.5 Create `src/utils/statCalculators.js` with all pure stat computation functions
    - `computeConsistencyScore`, `computeContestStats`, `computeSubmissionStats`, `computeUniqueSolved`, `computeTagCounts`, `computeDifficultyStats`, `computeLanguageStats`, `computeHeatmapData`, `computeActivityByDow`, `computeActivityByMonth`, `computeActivityByYear`, `computeComputedStats`
    - All functions must be pure (no side effects, no imports from services or hooks)
    - _Requirements: 7.1, 11.1, 11.2, 12.1, 14.1, 15.1, 18.2, 19.1, 19.2, 19.3_
  - [ ]* 3.6 Write property tests for stat calculators — Properties 13–19
    - **Property 13: Contest sort order**
    - **Property 14: Consistency score formula**
    - **Property 15: Verdict counts sum to total submissions**
    - **Property 16: Unique solved count cannot exceed total AC count**
    - **Property 18: Tag counts do not exceed unique problem count**
    - **Property 19: Heatmap uses only AC submissions with correct date format**
    - **Validates: Requirements 10.2, 11.2, 12.1, 14.1, 15.1, 18.2**
    - File: `src/__tests__/properties/statCalculators.property.test.js`
  - [ ] 3.7 Create `src/utils/problemBinner.js` with `BINS` array (800–3500 in 100-pt steps) and `binByRating(problems, solvedSet)`
    - Returns array of 28 counts; problems without a rating field are excluded
    - _Requirements: 14.2, 21.1_
  - [ ]* 3.8 Write property test for `binByRating` — Property 17
    - **Property 17: Rating bin assignment is total and exclusive**
    - **Validates: Requirements 14.2, 21.1**
    - File: `src/__tests__/properties/statCalculators.property.test.js`

- [ ] 8. Layout Components (`src/components/layout/`)
  - [ ] 8.1 Create `SectionHeader.jsx` — renders gradient text `<h2>` accepting `title` and optional `subtitle`
    - _Requirements: 5.7_
  - [ ] 8.2 Create `Sidebar.jsx` — 240 px wide, `hidden lg:flex`, sticky; includes user mini-card (avatar, handle, rank badge) and smooth-scroll nav links; active section highlighted via `IntersectionObserver`
    - _Requirements: 5.1_
  - [ ] 8.3 Create `MobileNav.jsx` — hamburger button fixed top-right on `< lg`; opens drawer with same nav links
    - _Requirements: 5.2_
  - [ ] 8.4 Create `PageWrapper.jsx` — root `bg-gray-950 min-h-screen` container; renders `<TopProgressBar>` overlay and slot for page content
    - _Requirements: 5.5_

- [ ] 9. Global Chart.js registration and routing
  - [ ] 9.1 Implement `src/main.jsx`
    - Register all Chart.js components: `CategoryScale`, `LinearScale`, `PointElement`, `LineElement`, `BarElement`, `ArcElement`, `Filler`, `Tooltip`, `Legend`, `annotationPlugin`, `zoomPlugin`
    - Import `src/styles/index.css` and `src/styles/print.css`
    - Render `<App />` into `#root`
    - _Requirements: 30.1_
  - [ ] 9.2 Implement `src/App.jsx` — `BrowserRouter` with routes: `"/"` → `<HomePage>`, `"/user/:handle"` → `<Suspense fallback={<DashboardSkeleton>}> <lazy(DashboardPage)>`; add `"*"` → `<NotFoundPage>`
    - Create `src/pages/NotFoundPage.jsx` with a "404 — Page not found" message and link back to "/"
    - _Requirements: 27.4_

- [ ] 10. Homepage (`src/pages/HomePage.jsx`)
  - [ ] 10.1 Build hero section with animated gradient background using Framer Motion + Tailwind `animate-pulse`
    - _Requirements: 3.1_
  - [ ] 10.2 Build glassmorphism search card with handle `<input>`, inline error `<p>`, and "Analyze" `<Button>`
    - Wire URL extraction: `extractHandle(input)` from `validators.js`
    - Wire validation: `validateHandle(handle)` and display inline error on failure
    - Apply `shake` motion variant on the card when there is an error
    - On submit with a valid handle: set button loading state, call `navigate(\`/user/${handle}\`)`
    - _Requirements: 3.2–3.8_
  - [ ] 10.3 Render feature highlight strip below hero with exactly 6 `@heroicons/react` icons and descriptive labels
    - _Requirements: 3.9_

- [ ] 11. Dashboard page scaffold and computed stats (`src/pages/DashboardPage.jsx`)
  - [ ] 11.1 Create lazy-loaded `DashboardPage.jsx`
    - Extract `handle` via `useParams()`; call `useCodeforcesData(handle)`
    - Compute all `useMemo` derived values: `contestStats`, `submissionStats`, `uniqueSolved`, `tagCounts`, `heatmapData`, `computedStats`, `recommendations`
    - Wrap all event handlers in `useCallback`: `handleSort`, `handlePageChange`, `handleRefetch`, `handlePrint`
    - Render `<PageWrapper>` → `<Sidebar>` + `<MobileNav>` + `<main>` grid
    - Render `<TopProgressBar>` while `loading=true`; replace skeletons with real sections when `loading=false`
    - Handle error states: 400 → "No user found" card + "Search Again" button; 429 → `<RateLimitTimer>`; partial failure → `<WarningBanner>`; all failed → network error card + retry
    - Wrap each major section in `<ErrorBoundary>`
    - _Requirements: 5.1–5.9, 26.1–26.5, 27.1–27.5_
  - [ ] 11.2 Create `src/components/WarningBanner.jsx` and `src/components/RateLimitTimer.jsx`
    - `WarningBanner`: accepts `failedEndpoints` array; renders dismissible amber banner
    - `RateLimitTimer`: accepts `retryAfter` seconds; counts down with `setInterval`; enables retry when reaching 0
    - _Requirements: 26.3, 26.5_
  - [ ] 11.3 Implement loading skeleton layout inside `DashboardPage`
    - Show `<DashboardSkeleton>` (skeleton profile + 4 stat cards + 2 chart blocks) while `loading=true`
    - Replace each skeleton with real content once `loading=false` (no full page re-render)
    - _Requirements: 4.1–4.6_
  - [ ] 3.9 Create `src/utils/recommendations.js` with `getRecommendations(problems, solvedSet, currentRating, weakTags, limit)`
    - Excludes solved problems; filters to ±200 of currentRating; sorts by weak-tag overlap descending; returns up to `limit` (default 20)
    - _Requirements: 23.1, 23.2, 23.3, 23.4_
  - [ ]* 3.10 Write property test for `getRecommendations` — Property 21
    - **Property 21: Recommendations exclude solved problems and respect rating window**
    - **Validates: Requirements 23.1, 23.2**
    - File: `src/__tests__/properties/recommendations.property.test.js`
  - [ ] 3.11 Create `src/utils/insightGenerator.js` with `generateInsights(stats)` returning ≥ 10 `{ icon, text }` objects
    - Derive insights from: rating trend, top language, weakest/strongest tags, submission frequency, consistency score, avg difficulty, highest difficulty, most active day of week, contest performance metrics
    - _Requirements: 22.1, 22.3_
  - [ ]* 3.12 Write property test for `generateInsights` — Property 20
    - **Property 20: AI insights count is at least 10**
    - **Validates: Requirements 22.1**
    - File: `src/__tests__/properties/statCalculators.property.test.js`
  - [ ] 3.13 Create `src/utils/chartDefaults.js` exporting `CHART_DEFAULTS` object
    - `responsive: true`, `maintainAspectRatio: false`, transparent backgrounds, grid color `rgba(255,255,255,0.05)`, tick color `rgba(255,255,255,0.6)`, animation `duration: 600, easing: 'easeInOutQuart'`
    - _Requirements: 30.2, 30.3, 30.4, 30.6_
  - [ ] 3.14 Create `src/utils/motionVariants.js` exporting `fadeSlideUp`, `staggerContainer`, and `shake` Framer Motion variants
    - `fadeSlideUp`: `hidden: { opacity:0, y:20 }`, `visible: { opacity:1, y:0, transition: { duration:0.4, ease:'easeOut' } }`
    - `staggerContainer`: `visible: { transition: { staggerChildren: 0.07 } }`
    - `shake`: `x: [0, -8, 8, -8, 8, 0], transition: { duration: 0.4 }`
    - _Requirements: 5.8, 5.9, 3.5, 3.6, 3.7_

- [ ] 4. Checkpoint — utilities and constants
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 12. Profile Card (`src/components/ProfileCard.jsx`)
  - [ ] 12.1 Implement `ProfileCard` accepting `profile` prop; wrap with `React.memo`
    - Display `titlePhoto` avatar, handle, rank badge colored by `RANK_COLORS[profile.rank]`
    - Display current rating and max rating as labeled numerics
    - Display country flag emoji, organization, city — omit if absent
    - Display contribution, friend count, registration date formatted as "MMM d, yyyy"
    - Display last-online time as "X days ago"
    - Render "View on Codeforces" button opening `https://codeforces.com/profile/{handle}` in new tab with `rel="noopener noreferrer"`
    - Wrap in `<motion.div>` with `fadeSlideUp` variant inside `<GlassCard>`
    - _Requirements: 6.1–6.6_

- [ ] 13. Summary Stats (`src/components/SummaryStats.jsx`)
  - [ ] 13.1 Implement 8-card `SummaryStats` section accepting `contests` prop; wrap with `React.memo`
    - Cards: Current Rating, Max Rating, Total Contests, Best Rank, Worst Rank, Average Rank, Highest Rating Gain, Biggest Rating Loss
    - Each card renders a `@heroicons/react` icon, text label, and `<AnimatedNumber>` from 0→value over 1000 ms
    - Display "—" for all contest-derived cards when `contests` is empty or null
    - Use `staggerContainer` + `fadeSlideUp` variants for staggered entrance
    - _Requirements: 7.1–7.4_

- [ ] 14. Rating History Chart (`src/charts/RatingHistoryChart.jsx`)
  - [ ] 14.1 Implement `RatingHistoryChart` accepting `contests` prop; wrap with `React.memo`
    - Line chart with X = "MMM yyyy" dates, Y = rating
    - Create gradient fill via `ctx.createLinearGradient` (accent color → transparent)
    - Add `chartjs-plugin-annotation` box annotations for each `RATING_BANDS` entry behind the line
    - Tooltip callback showing contest name, rating, formatted delta
    - Enable zoom (scroll-wheel) and pan (click-drag) via `chartjs-plugin-zoom`
    - When `contests.length === 1`, set `pointRadius: 8` and disable line
    - _Requirements: 8.1–8.6, 30.1–30.6_

- [ ] 15. Rating Change Bar Chart (`src/charts/RatingChangeChart.jsx`)
  - [ ] 15.1 Implement `RatingChangeChart` accepting `contests` prop; wrap with `React.memo`
    - One bar per contest, chronological order; color per `formatters` delta sign (`#22c55e` / `#ef4444`)
    - Tooltip showing contest name, old rating, new rating, delta formatted with "+" / "−"
    - When `contests.length > 50`: set container `overflow-x: auto`, fix `barThickness` ≥ 8 px
    - _Requirements: 9.1–9.5, 30.1–30.6_

- [ ] 16. Contest Timeline Table (`src/components/ContestTable.jsx`)
  - [ ] 16.1 Implement sortable, paginated `ContestTable` accepting `contests` prop; wrap with `React.memo`
    - Columns: Contest Name, Date ("MMM d, yyyy"), Rank, Old Rating, New Rating, Δ
    - Click column header to sort ascending/descending with direction indicator; wrap sort handler in `useCallback`
    - 20 rows per page with Previous / page numbers / Next pagination controls
    - Color Δ cell green for positive, red for negative
    - When `contests.length > 100`, render rows via `react-window` `FixedSizeList` (row height 48 px)
    - _Requirements: 10.1–10.5, 27.3, 27.5_

- [ ] 17. Contest Analytics Grid (`src/components/ContestAnalytics.jsx`)
  - [ ] 17.1 Implement `ContestAnalytics` accepting `contests` prop; wrap with `React.memo`
    - Display 8 stats using `computeContestStats`: Total, Avg Rank, Median Rank, Best Rank, Worst Rank, Largest Gain, Largest Drop, Consistency Score (2 dp)
    - Show "N/A" for Consistency Score when computation produces division-by-zero
    - Show `<EmptyState text="No contest data available.">` when `contests` is empty
    - _Requirements: 11.1–11.4_

- [ ] 18. Submission Statistics (`src/components/SubmissionStats.jsx`)
  - [ ] 18.1 Implement `SubmissionStats` accepting `submissions` prop; wrap with `React.memo`
    - Compute verdict counts via `computeSubmissionStats`; "Other" aggregates unlisted verdicts
    - Doughnut chart on the left, stat grid on the right; side-by-side ≥ 768 px, stacked below
    - Each verdict uses consistent color from `VERDICT_COLORS`
    - Show `<EmptyState text="No submissions yet.">` when `submissions` is empty
    - _Requirements: 12.1–12.4_
- [ ] 5. API layer
  - [ ] 5.1 Create `src/services/apiClient.js` — Axios instance with retry/backoff interceptor and normalization helpers
    - Base URL `https://codeforces.com/api`, timeout 10 000 ms
    - Retry interceptor: retries up to 3 times on network error or 5xx, waits `[1000, 2000, 4000]` ms before each retry using exponential backoff
    - `normalize(response)` and `normalizeError(error)` helpers producing `{ data, error, status }`
    - 400 → `error: "User not found. Check the handle."`, data: null
    - 429 → `error: "Rate limited."`, `retryAfter` parsed from `Retry-After` header
    - 5xx after 3 retries → `error: "Server error after 3 retries."`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.10, 1.11, 1.12_
  - [ ]* 5.2 Write property tests for API client — Properties 1 and 2
    - **Property 1: Retry backoff schedule**
    - **Property 2: Normalized response shape**
    - **Validates: Requirements 1.3, 1.4, 1.10**
    - File: `src/__tests__/properties/apiClient.property.test.js`
    - Mock Axios with `vi.fn()` to simulate failure sequences
  - [ ] 5.3 Create `src/services/index.js` — five exported API functions that delegate to the Axios instance
    - `getUserInfo(handle)` → GET `/user.info?handles={handle}`, returns `result[0]`
    - `getUserRating(handle)` → GET `/user.rating?handle={handle}`, returns full result array
    - `getUserStatus(handle)` → GET `/user.status?handle={handle}&count=10000`
    - `getProblemset()` → GET `/problemset.problems`
    - `getContestList()` → GET `/contest.list`
    - All five return `Promise<NormalizedResponse<T>>`
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 1.9_

- [ ] 6. Custom hook — `useCodeforcesData`
  - [ ] 6.1 Create `src/hooks/useCodeforcesData.js` with caching, parallel fetch, refetch, and AbortController cancellation
    - State: `profile`, `contests`, `submissions`, `problems`, `loading`, `error`
    - On mount / handle change: read `localStorage` key `cf_insights_{handle.toLowerCase()}`; if age < 900 000 ms return cached; else fetch all 5 in parallel via `Promise.allSettled`
    - Write `{ timestamp, ttl: 900_000, data }` to localStorage on success (skip on 429)
    - `refetch()` clears the localStorage key and re-runs the effect
    - Create `AbortController` per effect run; clean up on handle change / unmount
    - Partial failure: populate available fields, set `error` to comma-joined failed endpoint names
    - All failure: set all data fields to `null`, set general network error message
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  - [ ]* 6.2 Write property tests for the data hook — Properties 3–8
    - **Property 3: All five endpoints called in parallel**
    - **Property 4: Loading lifecycle invariant**
    - **Property 5: Cache key format**
    - **Property 6: Cache freshness gate**
    - **Property 7: Partial failure populates available fields**
    - **Property 8: Cache round-trip fidelity**
    - **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6, 2.8, 2.11**
    - File: `src/__tests__/properties/dataHook.property.test.js`
    - Use `renderHook` from `@testing-library/react` and mock `src/services/index.js`

- [ ] 7. Checkpoint — API layer and hook
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 19. Language Breakdown (`src/charts/LanguageBreakdown.jsx`)
  - [ ] 19.1 Implement `LanguageBreakdown` accepting `submissions` prop; wrap with `React.memo`
    - Pie chart where each slice = one language proportional to submission count
    - Horizontal bar chart of all languages with ≥ 1 submission, sorted descending, labeled with count
    - Badge displaying top language name and its count
    - Handle single-language case (single-slice pie + single bar)
    - Show `<EmptyState>` when `submissions` is empty
    - _Requirements: 13.1–13.5_

- [ ] 20. Problem Solving Stats (`src/components/ProblemStats.jsx`)
  - [ ] 20.1 Implement `ProblemStats` accepting `submissions` and `problems` props; wrap with `React.memo`
    - 4 stat cards: Total Solved (all AC), Unique Solved (distinct problemId ACs), Average Difficulty (mean rating of rated unique solved, integer), Highest Difficulty Solved
    - Histogram of uniquely solved problems in 100-pt bins 800–3500 via `binByRating`
    - Exclude unrated problems from avg/max difficulty calculations
    - Display "—" for avg/max and empty histogram when zero solved
    - _Requirements: 14.1–14.4_

- [ ] 21. Tag Analysis (`src/charts/TagAnalysis.jsx`)
  - [ ] 21.1 Implement `TagAnalysis` accepting `submissions` prop; wrap with `React.memo`
    - Horizontal bar chart (`indexAxis: 'y'`) of top 20 tags sorted by solve count descending
    - Each bar labeled with its numeric count at the bar end
    - Render only available tags when fewer than 20 distinct tags exist
    - _Requirements: 15.1–15.4_

- [ ] 22. Weak Topics (`src/components/WeakTopics.jsx`)
  - [ ] 22.1 Implement `WeakTopics` accepting `submissions` prop; wrap with `React.memo`
    - Identify bottom 5 tags by solve count among tags with ≥ 1 attempted problem via `computeTagCounts`
    - Each tag rendered as a card with a "Practice →" link to `https://codeforces.com/problemset?tags={tag}`
    - _Requirements: 16.1, 16.2_

- [ ] 23. Strong Topics (`src/components/StrongTopics.jsx`)
  - [ ] 23.1 Implement `StrongTopics` accepting `submissions` prop; wrap with `React.memo`
    - Display top 10 tags by solve count as `<Badge>` cards showing the solve count
    - _Requirements: 17.1_

- [ ] 24. Activity Heatmap (`src/components/ActivityHeatmap.jsx`)
  - [ ] 24.1 Implement `ActivityHeatmap` accepting `submissions` prop; wrap with `React.memo`
    - Render `react-calendar-heatmap` covering last 365 days
    - Pass data from `computeHeatmapData` (AC only, `yyyy-MM-dd`)
    - GitHub-style 4–5 color intensity scale
    - Tooltip via `<Tooltip>` showing count and date on cell hover
    - _Requirements: 18.1–18.4_

- [ ] 25. Activity Charts (`src/charts/`)
  - [ ] 25.1 Create `DailyActivityChart.jsx` — bar chart of submission counts by day of week (Mon–Sun) from `computeActivityByDow`; wrap with `React.memo`; _Requirements: 19.1_
  - [ ] 25.2 Create `MonthlyActivityChart.jsx` — line chart by calendar month (Jan–Dec) from `computeActivityByMonth`; wrap with `React.memo`; _Requirements: 19.2_
  - [ ] 25.3 Create `YearlyActivityChart.jsx` — bar chart by year from `computeActivityByYear`; wrap with `React.memo`; _Requirements: 19.3_

- [ ] 26. Verdict Distribution (`src/charts/VerdictDistribution.jsx`)
  - [ ] 26.1 Implement `VerdictDistribution` accepting `submissions` prop; wrap with `React.memo`
    - Doughnut or pie chart with one arc per verdict using `VERDICT_COLORS`
    - _Requirements: 20.1_

- [ ] 27. Problem Rating Distribution (`src/charts/ProblemRatingDistribution.jsx`)
  - [ ] 27.1 Implement `ProblemRatingDistribution` accepting `submissions` and `problems` props; wrap with `React.memo`
    - Histogram of AC-only unique problems binned in 100-pt intervals 800–3500 via `binByRating`
    - _Requirements: 21.1_
- [ ] 8. Reusable UI primitives
  - [ ] 8.1 Create `src/components/ui/GlassCard.jsx`
    - Renders a `<div>` with `bg-white/5 backdrop-blur-md border border-white/10 rounded-xl` plus a `className` prop for extension
    - _Requirements: 5.6_
  - [ ] 8.2 Create `src/components/ui/Button.jsx`
    - Variants: `primary` (gradient bg, white text) and `ghost` (transparent, border)
    - Accepts `loading` prop to show a spinner inline; `disabled` when loading
    - _Requirements: 3.8_
  - [ ] 8.3 Create `src/components/ui/Badge.jsx`
    - Accepts `color` prop and renders a small inline pill badge
    - Used for rank badge on ProfileCard and TopLanguage on LanguageBreakdown
    - _Requirements: 6.1, 13.3_
  - [ ] 8.4 Create `src/components/ui/Skeleton.jsx`
    - Renders a `<div>` with Tailwind `animate-pulse bg-white/10 rounded` at configurable width/height
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 8.5 Create `src/components/ui/Tooltip.jsx`
    - Wrapper that shows a dark tooltip on hover via Framer Motion `AnimatePresence`
    - _Requirements: 8.4, 9.4_
  - [ ] 8.6 Create `src/components/ui/EmptyState.jsx`
    - Accepts `text` prop; renders a centered illustration SVG and message
    - Used for zero-submissions, zero-contests, zero-languages empty states
    - _Requirements: 12.3, 26.4_
  - [ ] 8.7 Create `src/components/ui/ErrorBoundary.jsx`
    - Class-based React Error Boundary; fallback renders a "Section unavailable" GlassCard
    - _Requirements: 26_
  - [ ] 8.8 Create `src/components/ui/AnimatedNumber.jsx`
    - Uses Framer Motion `useMotionValue` + `animate` to count from 0 to `target` over 1000 ms
    - Renders via `useTransform` → `Math.round(v).toLocaleString()`
    - _Requirements: 7.3_
  - [ ] 8.9 Create `src/components/ui/TopProgressBar.jsx`
    - Fixed-position full-width bar at top of viewport; animates from left to right while `loading === true`
    - Disappears when `loading` becomes false
    - _Requirements: 4.5, 4.6_
  - [ ] 8.10 Create `src/components/ui/DashboardSkeleton.jsx`
    - Full-page Suspense fallback: skeleton avatar + 4 text lines, 4 stat card skeletons, 2 chart skeletons (16:9 ratio)
    - Uses `<Skeleton>` from 8.4
    - _Requirements: 4.1, 4.2, 4.3_


- [ ] 28. AI Insights (`src/components/AiInsights.jsx`)
  - [ ] 28.1 Implement `AiInsights` accepting `stats` (ComputedStats) prop; wrap with `React.memo`
    - Call `generateInsights(stats)` to produce ≥ 10 insight objects
    - Render each insight as an animated `<GlassCard>` with `LightBulbIcon` from `@heroicons/react` and insight text
    - Use `staggerContainer` + `fadeSlideUp` for staggered entrance
    - _Requirements: 22.1–22.3_

- [ ] 29. Practice Recommendations (`src/components/PracticeRecommendations.jsx`)
  - [ ] 29.1 Implement `PracticeRecommendations` accepting `profile`, `submissions`, `problems` props; wrap with `React.memo`
    - Display up to 20 problems from `getRecommendations`: Problem Name, Rating, Tags, "Solve →" link to `https://codeforces.com/problemset/problem/{contestId}/{index}`
    - _Requirements: 23.1–23.4_

- [ ] 30. Achievements (`src/components/Achievements.jsx`)
  - [ ] 30.1 Implement `Achievements` accepting `stats` prop; wrap with `React.memo`
    - Iterate `BADGE_DEFINITIONS`; call `badge.condition(stats)` to determine unlocked state
    - Render unlocked badges in full color; locked badges in grayscale with lock overlay
    - _Requirements: 24.1–24.4_
  - [ ]* 30.2 Write property tests for achievements — Property 22
    - Create `src/__tests__/properties/achievements.property.test.js`
    - **Property 22: Badge evaluation consistent with condition** — for any ComputedStats, badge unlocked state equals `badge.condition(stats)` for all badges; **Validates: Requirements 24.1, 24.2, 24.3**
    - _Requirements: 24.1–24.3_

- [ ] 31. Download as PDF button (`src/components/DownloadPdfButton.jsx`)
  - [ ] 31.1 Implement `DownloadPdfButton` calling `window.print()` on click; wrap `onClick` in `useCallback`
    - Complete `src/styles/print.css`: hide sidebar, mobile-nav, progress bar, buttons; single-column grid; white background; glass cards → plain white boxes; `break-inside: avoid` per section; `max-width: 100%` on canvases
    - _Requirements: 25.1–25.3_

- [ ] 32. Checkpoint — All dashboard sections complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 33. Performance hardening pass
  - [ ] 33.1 Audit all 22 section components and all 9 chart components — confirm each has `export default React.memo(...)`
    - _Requirements: 27.1_
  - [ ] 33.2 Audit `DashboardPage.jsx` — confirm all stat computations use `useMemo` and all event handlers use `useCallback`
    - _Requirements: 27.2, 27.3_
  - [ ] 33.3 Confirm `DashboardPage` is loaded via `React.lazy` wrapped in `React.Suspense` in `App.jsx`
    - _Requirements: 27.4_
  - [ ] 33.4 Confirm `ContestTable` uses `react-window` `FixedSizeList` when `contests.length > 100`
    - _Requirements: 27.5_

- [ ] 34. Final checkpoint — full integration check
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build; they do not block any subsequent non-optional tasks
- All 22 correctness properties defined in the design must be covered by property-based tests using `fast-check` with a minimum of 100 iterations each
- Every chart component must be registered globally via the Chart.js `register` call in `main.jsx` **before** any chart renders — failure to do so causes a runtime error
- The `react-window` virtualization in `ContestTable` is conditionally applied only when row count exceeds 100; below that threshold, plain DOM rows are used
- `DashboardPage` is the **only** component that calls `useCodeforcesData`; all child components receive narrow prop slices to preserve memoization
- The 429 rate-limit countdown timer must NOT be reset by a re-render; use a ref-backed `setInterval` inside the `RateLimitTimer` component
- Property test files live under `src/__tests__/properties/`; run them with `vitest --run`
- [ ] 9. Layout components
  - [ ] 9.1 Create `src/components/layout/PageWrapper.jsx`
    - Root container: `bg-gray-950 min-h-screen text-white`; renders `<TopProgressBar>` as an overlay and `{children}`
    - _Requirements: 5.5_
  - [ ] 9.2 Create `src/components/layout/SectionHeader.jsx`
    - Renders `<h2>` with gradient text styling (`bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`)
    - _Requirements: 5.7_
  - [ ] 9.3 Create `src/components/layout/Sidebar.jsx`
    - `hidden lg:flex flex-col w-60 sticky top-0 h-screen`; user mini-card (avatar, handle, rank badge) + list of smooth-scroll nav links
    - Active section highlighted via IntersectionObserver watching all `[id]` sections
    - _Requirements: 5.1_
  - [ ] 9.4 Create `src/components/layout/MobileNav.jsx`
    - Hamburger button fixed top-right on `< lg`; opens a Framer Motion drawer with the same nav links
    - _Requirements: 5.2_

- [ ] 10. Homepage — `src/pages/HomePage.jsx`
  - [ ] 10.1 Implement the full-screen hero with animated gradient background (Framer Motion gradient shift + CSS `animate-pulse` glow orbs)
    - _Requirements: 3.1_
  - [ ] 10.2 Implement the `<SearchCard>` component inside the hero — glassmorphism card containing:
    - A text input for handle entry
    - URL extraction via `extractHandle` from `src/utils/validators.js`
    - Validation via `validateHandle`; inline error message with Framer Motion `shake` animation on failure
    - "Analyze" Button (primary variant) that shows a spinner inside until navigation completes
    - On valid submit: `useNavigate()` to `/user/${handle}`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - [ ] 10.3 Implement the feature strip below the hero — exactly 6 `<FeatureHighlight icon label />` items in a flex row
    - Icons from `@heroicons/react/24/outline`; labels describe: Rating History, Tag Analysis, Activity Heatmap, AI Insights, Practice Recommendations, Achievements
    - _Requirements: 3.9_


## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"]
    },
    {
      "id": 1,
      "tasks": ["3.1", "4.1", "4.3", "4.7"]
    },
    {
      "id": 2,
      "tasks": ["3.2", "4.5", "4.8", "4.10", "4.11"]
    },
    {
      "id": 3,
      "tasks": ["3.3", "4.2", "4.4", "4.6", "4.9", "5.1"]
    },
    {
      "id": 4,
      "tasks": ["5.2", "7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10"]
    },
    {
      "id": 5,
      "tasks": ["8.1", "8.2", "8.3", "8.4", "9.1"]
    },
    {
      "id": 6,
      "tasks": ["9.2", "10.1", "10.2", "10.3"]
    },
    {
      "id": 7,
      "tasks": ["11.1", "11.2", "11.3"]
    },
    {
      "id": 8,
      "tasks": ["12.1", "13.1", "14.1", "15.1", "16.1", "17.1", "18.1", "19.1", "20.1", "21.1", "22.1", "23.1"]
    },
    {
      "id": 9,
      "tasks": ["24.1", "25.1", "25.2", "25.3", "26.1", "27.1", "28.1", "29.1"]
    },
    {
      "id": 10,
      "tasks": ["30.1", "30.2", "31.1"]
    },
    {
      "id": 11,
      "tasks": ["33.1", "33.2", "33.3", "33.4"]
    }
  ]
}
```
- [ ] 11. `src/App.jsx` + routing
  - [ ] 11.1 Create `src/App.jsx` with `BrowserRouter`, two routes (`/` → `<HomePage>`, `/user/:handle` → `<Suspense fallback={<DashboardSkeleton />}><DashboardPage /></Suspense>`), and `React.lazy` import for `DashboardPage`
    - _Requirements: 27.4_

- [ ] 12. Dashboard section components
  - [ ] 12.1 Create `src/components/ProfileCard.jsx`
    - Props: `profile` (CFUserInfo)
    - Display: avatar (`titlePhoto`), handle, rank badge (color from `RANK_COLORS`), current rating, max rating
    - Conditional fields: country flag emoji, organization, city (omit if absent)
    - Contribution score, friend count, registration date (`formatFullDate`), last-online (`daysAgo` + "X days ago")
    - "View on Codeforces" button → `target="_blank" rel="noopener noreferrer"`
    - Wrap with `React.memo`; animate with `fadeSlideUp`; use `GlassCard`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [ ] 12.2 Create `src/components/SummaryStats.jsx`
    - Props: `contests` (CFRatingChange[])
    - Render 8 stat cards: Current Rating, Max Rating, Total Contests, Best Rank, Worst Rank, Average Rank, Highest Rating Gain, Biggest Rating Loss
    - Each card: `@heroicons/react` icon, text label, `<AnimatedNumber>` value
    - Show "—" for all metrics when `contests` is empty/null
    - Stagger card entrance via `staggerContainer`; wrap with `React.memo`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ] 12.3 Create `src/components/ContestTable.jsx`
    - Props: `contests` (CFRatingChange[])
    - Columns: Contest Name, Date, Rank, Old Rating, New Rating, Δ
    - Sortable columns with toggle asc/desc and direction indicator; green/red Δ cell coloring
    - 20 rows per page with pagination controls (Previous, page numbers, Next)
    - Virtualize with `react-window` `FixedSizeList` when `contests.length > 100`
    - Wrap with `React.memo`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 27.5_
  - [ ] 12.4 Create `src/components/ContestAnalytics.jsx`
    - Props: `contests` (CFRatingChange[])
    - Display 8 stats: Total Contests, Average Rank, Median Rank, Best Rank, Worst Rank, Largest Gain, Largest Drop, Consistency Score (2 decimal places)
    - "No contest data available." empty state when `contests` empty/null
    - "N/A" for Consistency Score on division-by-zero
    - Wrap with `React.memo`; use `GlassCard`, `fadeSlideUp`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ] 12.5 Create `src/components/SubmissionStats.jsx`
    - Props: `submissions` (CFSubmission[])
    - Counts for: Total, AC, WA, TLE, MLE, RE, CE, Other
    - Side-by-side doughnut (left) + stat grid (right) on ≥ 768 px; stacked vertically on narrower viewports
    - Zero-submissions empty state with illustration and "No submissions yet." text
    - Wrap with `React.memo`; use `GlassCard`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [ ] 12.6 Create `src/components/ProblemStats.jsx`
    - Props: `submissions` (CFSubmission[]), `problems` (CFProblem[])
    - Display: Total Solved, Unique Solved, Average Difficulty, Highest Difficulty Solved
    - Exclude problems without a rating from difficulty calculations; show "—" when none
    - Wrap with `React.memo`; use `GlassCard`, `fadeSlideUp`
    - _Requirements: 14.1, 14.3, 14.4_
  - [ ] 12.7 Create `src/components/WeakTopics.jsx`
    - Props: `submissions` (CFSubmission[])
    - Identify bottom 5 tags by solve count (only tags with ≥ 1 attempted problem)
    - Each tag rendered as a card with a "Practice →" button linking to `https://codeforces.com/problemset?tags={tag}`
    - Wrap with `React.memo`; use `GlassCard`, `fadeSlideUp`
    - _Requirements: 16.1, 16.2_
  - [ ] 12.8 Create `src/components/StrongTopics.jsx`
    - Props: `submissions` (CFSubmission[])
    - Display top 10 tags by solve count as badge-style cards showing the solve count
    - Wrap with `React.memo`; use `GlassCard`, `fadeSlideUp`
    - _Requirements: 17.1_
  - [ ] 12.9 Create `src/components/ActivityHeatmap.jsx`
    - Props: `submissions` (CFSubmission[])
    - Render `react-calendar-heatmap` for the last 365 days (AC submissions only, grouped by `yyyy-MM-dd`)
    - Tooltip showing submission count and date via `react-tooltip` or Tooltip primitive
    - GitHub-style 4-5 intensity color scale
    - Wrap with `React.memo`; use `GlassCard`
    - _Requirements: 18.1, 18.2, 18.3, 18.4_
  - [ ] 12.10 Create `src/components/AiInsights.jsx`
    - Props: `stats` (ComputedStats)
    - Call `generateInsights(stats)` and render each insight as a Framer Motion card with a lightbulb icon
    - Wrap with `React.memo`; stagger card entrance
    - _Requirements: 22.1, 22.2, 22.3_
  - [ ] 12.11 Create `src/components/PracticeRecommendations.jsx`
    - Props: `profile`, `submissions`, `problems`
    - Display up to 20 recommended problems: Problem Name, Rating, Tags, "Solve →" link to `https://codeforces.com/problemset/problem/{contestId}/{index}`
    - Uses `getRecommendations` from utils
    - Wrap with `React.memo`; use `GlassCard`, `fadeSlideUp`
    - _Requirements: 23.1, 23.2, 23.3, 23.4_
  - [ ] 12.12 Create `src/components/Achievements.jsx`
    - Props: `stats` (ComputedStats)
    - Evaluate each badge in `BADGE_DEFINITIONS` via `badge.condition(stats)`
    - Unlocked: full color; locked: grayscale/opacity-50
    - Wrap with `React.memo`; stagger entrance via `staggerContainer`
    - _Requirements: 24.1, 24.2, 24.3, 24.4_
  - [ ]* 12.13 Write property test for Achievements badge evaluation — Property 22
    - **Property 22: Badge evaluation is consistent with condition function**
    - **Validates: Requirements 24.1, 24.2, 24.3**
    - File: `src/__tests__/properties/achievements.property.test.js`
  - [ ] 12.14 Create `src/components/DownloadPdfButton.jsx`
    - Renders a "Download as PDF" Button that calls `window.print()` via `useCallback`
    - Add `className="download-pdf-btn"` for print.css hiding
    - _Requirements: 25.1, 25.2_
  - [ ] 12.15 Create `src/components/WarningBanner.jsx`
    - Props: `failedEndpoints` (string[])
    - Renders a yellow/amber banner listing failed endpoints; only renders when `failedEndpoints.length > 0`
    - _Requirements: 26.5_
  - [ ] 12.16 Create `src/components/RateLimitTimer.jsx`
    - Props: `retryAfter` (number), `onRetry` (function)
    - Counts down from `retryAfter` using `setInterval`; enables retry button when `seconds === 0`
    - _Requirements: 26.3_

- [ ] 13. Checkpoint — UI components and sections
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Chart components (`src/charts/`)
  - [ ] 14.1 Create `src/charts/RatingHistoryChart.jsx`
    - Type: Line with area fill; gradient via `ctx.createLinearGradient`
    - X-axis: `formatContestDate`; Y-axis: numeric rating
    - Annotation boxes behind line for each `RATING_BANDS` entry using `chartjs-plugin-annotation`
    - Scroll-wheel zoom + click-drag pan via `chartjs-plugin-zoom`
    - Single-point guard: if `contests.length === 1` set `pointRadius: 8` and disable line span
    - Custom tooltip: contest name, rating, delta via `formatDelta`
    - Merge with `CHART_DEFAULTS`; wrap with `React.memo`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 30.1–30.6_
  - [ ] 14.2 Create `src/charts/RatingChangeChart.jsx`
    - Type: Bar; one bar per contest ordered chronologically
    - Bar color: `#22c55e` for delta > 0, `#ef4444` for delta ≤ 0
    - Tooltip: contest name, old rating, new rating, formatted delta
    - When `contests.length > 50`: container `overflow-x: auto`, `barThickness` fixed so no bar < 8 px
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ] 14.3 Create `src/charts/LanguageBreakdown.jsx`
    - Renders two charts: Pie (proportional slices) + horizontal Bar (`indexAxis: 'y'`, sorted descending, labeled counts)
    - Badge showing top language name + submission count
    - Handle single-language and zero-submission states
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [ ] 14.4 Create `src/charts/TagAnalysis.jsx`
    - Type: Horizontal bar (`indexAxis: 'y'`); top 20 tags sorted descending by solve count
    - Inline data labels at end of each bar showing numeric solve count
    - Renders only available tags when fewer than 20
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  - [ ] 14.5 Create `src/charts/DailyActivityChart.jsx`
    - Type: Bar; X-axis Mon–Sun; Y-axis submission count
    - Uses `computeActivityByDow` result
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 19.1_
  - [ ] 14.6 Create `src/charts/MonthlyActivityChart.jsx`
    - Type: Line; X-axis Jan–Dec; Y-axis submission count
    - Uses `computeActivityByMonth` result
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 19.2_
  - [ ] 14.7 Create `src/charts/YearlyActivityChart.jsx`
    - Type: Bar; X-axis distinct years from submission data; Y-axis submission count
    - Uses `computeActivityByYear` result
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 19.3_
  - [ ] 14.8 Create `src/charts/VerdictDistribution.jsx`
    - Type: Doughnut; one arc per verdict; colors from `VERDICT_COLORS`
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 20.1_
  - [ ] 14.9 Create `src/charts/ProblemRatingDistribution.jsx`
    - Type: Bar; bins 800–3500 in 100-pt intervals; counts AC-only unique problems per bin via `binByRating`
    - Wrap with `React.memo`; merge `CHART_DEFAULTS`
    - _Requirements: 21.1_

- [ ] 15. `src/pages/DashboardPage.jsx` — wiring all 22 sections
  - [ ] 15.1 Implement `DashboardPage` (exported as `default`, loaded via `React.lazy`)
    - Call `useCodeforcesData(handle)` (handle from `useParams`)
    - Compute all derived data with `useMemo`: `contestStats`, `submissionStats`, `uniqueSolved`, `tagCounts`, `heatmapData`, `dowData`, `monthData`, `yearData`, `ratingBinData`, `computedStats`, `recommendations`
    - Wrap all event handlers (`handleSort`, `handlePageChange`, `handleRefetch`, `handlePrint`) with `useCallback`
    - _Requirements: 27.2, 27.3_
  - [ ] 15.2 Wire loading state and error handling in `DashboardPage`
    - While `loading === true`: render `<TopProgressBar>` + `<DashboardSkeleton>`
    - On 400 error: render "No user found" card with "Search Again" CTA (`navigate('/')`)
    - On 429 error: render `<RateLimitTimer retryAfter={...} onRetry={handleRefetch} />`
    - On partial failure: render `<WarningBanner failedEndpoints={...} />` above sections
    - On all-fail: render "Network Error" card with Retry button
    - _Requirements: 4.5, 26.1, 26.2, 26.3, 26.5_
  - [ ] 15.3 Wire all 22 dashboard section components in the main content grid
    - Structure: `<PageWrapper>` → `<Sidebar>` (hidden below lg) + `<MobileNav>` (hidden above lg) + `<main>` (4-col grid on xl, 1-col on < md)
    - Wrap each section in `<ErrorBoundary>` and `<motion.div variants={fadeSlideUp}>`
    - Section order and IDs: profile, summary-stats, rating-history, rating-changes, contest-table, contest-analytics, submissions, languages, problems, tags, weak-topics, strong-topics, activity-heatmap, daily-activity, monthly-activity, yearly-activity, verdict-distribution, problem-rating, ai-insights, recommendations, achievements, download-pdf
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [ ] 16. Checkpoint — DashboardPage wiring
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Global styles
  - [ ] 17.1 Create `src/styles/index.css`
    - Add Tailwind v4 `@import "tailwindcss"` directive
    - Define custom CSS variables for glassmorphism, gradient stops, and scrollbar styling
    - _Requirements: 30_
  - [ ] 17.2 Create `src/styles/print.css`
    - `@media print` rules: hide `.sidebar`, `.mobile-nav`, `.top-progress-bar`, `.download-pdf-btn`, `.retry-btn`, `.zoom-controls`
    - Force `.dashboard-grid` to `grid-template-columns: 1fr`
    - Override background to `#ffffff`, text to `#000000`, glass cards to plain white boxes
    - `break-inside: avoid` on `.dashboard-section`
    - _Requirements: 25.3_

- [ ] 18. `src/main.jsx` — entry point
  - [ ] 18.1 Create `src/main.jsx`
    - Import and register all Chart.js components globally (`CategoryScale`, `LinearScale`, `PointElement`, `LineElement`, `BarElement`, `ArcElement`, `Filler`, `Tooltip`, `Legend`, `annotationPlugin`, `zoomPlugin`)
    - Import `src/styles/index.css` and `src/styles/print.css`
    - Mount `<App />` to `#root` via `ReactDOM.createRoot`
    - _Requirements: 30.1_

- [ ] 19. Build verification
  - [ ] 19.1 Run `npm run build` and confirm it exits with code 0 and produces `dist/` with at least `index.html` and chunk JS files
    - Fix any TypeScript/ESLint/Vite errors that surface during the build
    - Verify no `console.error` calls appear in the browser when the built app loads
    - _Requirements: 29, 30_

- [ ] 20. Final checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.


---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 4, 7, 13, 16, 20 ensure incremental validation at natural seams
- Property tests use fast-check with `numRuns: 100`; each test is tagged with `// Feature: codeforces-insights, Property N: <text>`
- Property test files live in `src/__tests__/properties/`
- All dashboard section components must be wrapped with `React.memo` (Req 27.1)
- All stat computations must use `useMemo` (Req 27.2); all event handlers `useCallback` (Req 27.3)
- The design uses JavaScript (not TypeScript); type annotations in comments are for clarity only

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["3.1", "3.3", "3.5", "3.7", "3.9", "3.11", "3.13", "3.14"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.6", "3.8", "3.10", "3.12"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] },
    { "id": 6, "tasks": ["6.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"] },
    { "id": 9, "tasks": ["8.9", "8.10", "9.1", "9.2"] },
    { "id": 10, "tasks": ["9.3", "9.4", "10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3"] },
    { "id": 12, "tasks": ["11.1"] },
    { "id": 13, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8"] },
    { "id": 14, "tasks": ["12.9", "12.10", "12.11", "12.12", "12.14", "12.15", "12.16"] },
    { "id": 15, "tasks": ["12.13", "14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8", "14.9"] },
    { "id": 16, "tasks": ["15.1"] },
    { "id": 17, "tasks": ["15.2", "15.3"] },
    { "id": 18, "tasks": ["17.1", "17.2"] },
    { "id": 19, "tasks": ["18.1"] },
    { "id": 20, "tasks": ["19.1"] }
  ]
}
```
