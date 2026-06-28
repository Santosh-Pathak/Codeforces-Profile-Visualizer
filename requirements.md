# Requirements Document

## Introduction

Codeforces Insights is a client-only analytics dashboard for Codeforces competitive programmers. The application fetches data exclusively from the official Codeforces REST API via Axios and renders rich analytics — rating history, submission statistics, tag analysis, activity heatmaps, AI-generated insights, practice recommendations, and achievement badges — entirely in the browser. There is no backend, no database, and no authentication layer. The tech stack is React 19, Vite, Axios, React Router DOM, Chart.js / react-chartjs-2, react-calendar-heatmap, Tailwind CSS, @heroicons/react, Framer Motion, and date-fns.

---

## Glossary

- **Dashboard**: The main analytics page rendered after a valid handle is submitted.
- **Handle**: A Codeforces username, alphanumeric with underscores and hyphens, max 24 characters.
- **API_Client**: The Axios instance configured with base URL, timeout, retry, and error normalization.
- **Data_Hook**: The `useCodeforcesData(handle)` custom React hook.
- **Submission**: A single code submission returned by the Codeforces `/user.status` endpoint.
- **Contest_Entry**: A single rating change event returned by `/user.rating`.
- **Problem**: A Codeforces problem identified by `contestId + index`.
- **Verdict**: The result of a submission (AC, WA, TLE, MLE, RE, CE, or other).
- **Rating_Band**: A named range of Codeforces ratings (e.g. Newbie 0–1199, Specialist 1400–1599).
- **Rank_Color**: The hex color associated with a Codeforces rank tier.
- **Tag**: A topic label attached to a Codeforces problem (e.g. "dp", "graphs").
- **Consistency_Score**: `1 - (stddev(ratingChanges) / mean(abs(ratingChanges)))`, a derived metric.
- **AI_Insight**: A text observation generated purely from computed statistics without calling any external AI API.
- **Achievement_Badge**: A predefined badge unlocked when a computed statistic meets a condition.
- **TTL**: Time-to-live; cached data expires after 15 minutes.
- **Skeleton**: A placeholder UI element displayed while data is loading.
- **Glass_Card**: A UI card styled with `bg-white/5 backdrop-blur-md border border-white/10`.
- **Print_Mode**: A CSS print-media stylesheet activated by `window.print()`.

---

## Requirements

### Requirement 1: API Client

**User Story:** As a developer, I want a centralized Axios instance, so that all Codeforces API calls are consistent, retried on failure, and return a normalized response shape.

#### Acceptance Criteria

1. THE API_Client SHALL use `https://codeforces.com/api` as its base URL.
2. THE API_Client SHALL apply a 10-second request timeout to every call.
3. WHEN a request fails with a network error or a 5xx status, THE API_Client SHALL retry the request up to 3 times using exponential backoff (1 s, 2 s, 4 s).
4. WHEN all 3 retry attempts are exhausted without a successful response, THE API_Client SHALL stop retrying and return a normalized error object.
5. THE API_Client SHALL expose a `getUserInfo(handle)` function that calls `/user.info?handles={handle}`.
6. THE API_Client SHALL expose a `getUserRating(handle)` function that calls `/user.rating?handle={handle}`.
7. THE API_Client SHALL expose a `getUserStatus(handle)` function that calls `/user.status?handle={handle}&count=10000`.
8. THE API_Client SHALL expose a `getProblemset()` function that calls `/problemset.problems`.
9. THE API_Client SHALL expose a `getContestList()` function that calls `/contest.list`.
10. WHEN any API function completes (success or failure), THE API_Client SHALL return a normalized object with shape `{ data, error, status }` where `status` is the HTTP status code as a number, `data` is the parsed response payload or `null`, and `error` is an error message string or `null`.
11. IF the Codeforces API returns status `400`, THEN THE API_Client SHALL set `error` to a message indicating the handle was not found and set `data` to `null`.
12. IF the Codeforces API returns status `429`, THEN THE API_Client SHALL set `error` to a rate-limit message and include the `Retry-After` header value (in seconds) as a numeric field `retryAfter` on the returned object.

---

### Requirement 2: Data Hook

**User Story:** As a developer, I want a single `useCodeforcesData(handle)` hook, so that components can access all Codeforces data through one interface with caching and refetch support.

#### Acceptance Criteria

1. WHEN `useCodeforcesData(handle)` is called with a non-empty handle, THE Data_Hook SHALL invoke all five API functions in parallel using `Promise.allSettled`.
2. THE Data_Hook SHALL return `{ profile, contests, submissions, problems, loading, error }`.
3. WHILE data is being fetched, THE Data_Hook SHALL set `loading` to `true`.
4. WHEN all API calls have settled, THE Data_Hook SHALL set `loading` to `false`.
5. THE Data_Hook SHALL cache the result in `localStorage` under a key with the format `cf_insights_{handle}` where `{handle}` is the lowercase Codeforces handle.
6. WHEN cached data exists and its age is less than 15 minutes, THE Data_Hook SHALL return the cached data without making new API calls.
7. THE Data_Hook SHALL expose a `refetch()` function that clears the cache for the current handle and re-invokes all API calls.
8. IF one or more API calls fail while others succeed, THEN THE Data_Hook SHALL populate the available fields and set `error` to a message listing the failed endpoint names.
9. IF all five API calls fail, THEN THE Data_Hook SHALL set all data fields to `null` and set `error` to a general network failure message.
10. WHEN the handle prop changes, THE Data_Hook SHALL discard any in-flight requests for the previous handle and restart data fetching for the new handle.
11. FOR ALL valid data objects, caching then retrieving then parsing SHALL produce a deeply-equal object (round-trip cache property).

---

### Requirement 3: Homepage

**User Story:** As a visitor, I want a visually engaging homepage with a handle search input, so that I can look up any Codeforces user's analytics quickly.

#### Acceptance Criteria

1. THE Homepage SHALL render a full-screen hero section with an animated gradient background.
2. THE Homepage SHALL render a centered search card styled with glassmorphism.
3. WHEN a user pastes a full Codeforces profile URL (matching the pattern `codeforces.com/profile/{handle}`), THE Homepage SHALL extract the handle using `url.split('/profile/')[1]?.split('/')[0]`.
4. WHEN the URL extraction yields an empty string or `undefined`, THE Homepage SHALL treat the full input as the raw handle candidate and proceed to standard validation.
5. WHEN the user submits an empty input, THE Homepage SHALL display an inline error message with a shake animation and SHALL NOT navigate to the Dashboard.
6. WHEN the user submits a handle containing characters other than alphanumerics, underscores, or hyphens, THE Homepage SHALL display an inline validation error with a shake animation and SHALL NOT navigate to the Dashboard.
7. WHEN the user submits a handle longer than 24 characters, THE Homepage SHALL display an inline validation error with a shake animation and SHALL NOT navigate to the Dashboard.
8. WHEN the user submits a valid handle, THE Homepage SHALL navigate to the Dashboard route and display a loading spinner inside the "Analyze" button until navigation completes.
9. THE Homepage SHALL render a feature highlight strip below the hero containing exactly 6 icons with descriptive labels.

---

### Requirement 4: Loading State

**User Story:** As a user, I want informative loading indicators while data is being fetched, so that I know the application is working and roughly how much content to expect.

#### Acceptance Criteria

1. WHILE `loading` is `true`, THE Dashboard SHALL render a skeleton profile card containing an avatar circle placeholder and 4 text-line placeholders.
2. WHILE `loading` is `true`, THE Dashboard SHALL render 4 skeleton stat cards.
3. WHILE `loading` is `true`, THE Dashboard SHALL render 2 skeleton chart placeholders with aspect ratios of 16:9 each.
4. THE Dashboard SHALL animate all skeleton elements using Tailwind's `animate-pulse` utility.
5. WHILE `loading` is `true`, THE Dashboard SHALL render a top progress bar styled to resemble a page-load indicator (fixed position, full width, animating from left to right).
6. WHEN `loading` transitions from `true` to `false`, THE Dashboard SHALL replace each skeleton element with its corresponding real content without a full page re-render.

---

### Requirement 5: Dashboard Layout

**User Story:** As a user, I want a well-organized dashboard layout, so that I can navigate sections easily on any screen size.

#### Acceptance Criteria

1. THE Dashboard SHALL render a sticky left sidebar 240 px wide containing section navigation links and a user mini-card on viewports at or above the Tailwind `lg` breakpoint (1024 px).
2. WHEN the viewport width is below the Tailwind `lg` breakpoint, THE Dashboard SHALL hide the sidebar and replace it with a collapsible mobile menu or top navigation bar.
3. THE Dashboard SHALL render a scrollable main content area using a 4-column grid on viewports at or above the Tailwind `xl` breakpoint (1280 px).
4. WHEN the viewport width is below the Tailwind `md` breakpoint (768 px), THE Dashboard SHALL collapse the grid to a single column.
5. THE Dashboard SHALL use `bg-gray-950` as its root background color (dark mode only, no light mode toggle).
6. ALL cards within the Dashboard SHALL use the Glass_Card style (`bg-white/5 backdrop-blur-md border border-white/10`).
7. THE Dashboard SHALL render section headers with gradient text styling.
8. WHEN a dashboard section mounts, THE Dashboard SHALL animate it with a Framer Motion fade-and-slide-up entrance (opacity 0→1, y 20→0).
9. WHEN a section contains multiple child cards, THE Dashboard SHALL stagger their entrance animations using Framer Motion with a delay increment of 50–100 ms per child.

---

### Requirement 6: Profile Card

**User Story:** As a user, I want to see a comprehensive profile card, so that I can quickly assess a Codeforces user's identity and standing.

#### Acceptance Criteria

1. THE Profile_Card SHALL display the user's avatar image fetched from the `titlePhoto` field of the API response, the handle, and a rank badge whose text color matches the hex value in RANK_COLORS for the user's current rank.
2. THE Profile_Card SHALL display current rating and maximum rating as labeled numeric values.
3. THE Profile_Card SHALL display the country flag emoji derived from the `country` field, the organization, and the city; IF any of these fields is absent in the API response, THE Profile_Card SHALL omit that field without rendering an empty placeholder.
4. THE Profile_Card SHALL display the contribution score, friend count, and registration date; the registration date SHALL be formatted as "MMM d, yyyy" using date-fns `format()`.
5. THE Profile_Card SHALL display the last-online time as "X days ago" where X is computed using date-fns `differenceInDays(now, lastOnlineDate)`.
6. THE Profile_Card SHALL render a button labeled "View on Codeforces" that opens `https://codeforces.com/profile/{handle}` in a new browser tab using `target="_blank" rel="noopener noreferrer"`.

---

### Requirement 7: Summary Stats

**User Story:** As a user, I want a row of summary stat cards, so that I can see the most important metrics at a glance.

#### Acceptance Criteria

1. THE Summary_Stats section SHALL render 8 stat cards: Current Rating, Max Rating, Total Contests, Best Rank, Worst Rank, Average Rank (rounded to nearest integer), Highest Rating Gain (largest positive delta across all contests), and Biggest Rating Loss (largest negative delta across all contests as an absolute value).
2. EACH stat card SHALL display a @heroicons/react icon, a text label, and the computed numeric value.
3. WHEN a stat card mounts, THE stat card SHALL animate its displayed number from 0 to the final value over 1000 ms using a linear count-up animation.
4. WHEN there are zero contests, THE stat cards for Total Contests, Best Rank, Worst Rank, Average Rank, Highest Rating Gain, and Biggest Rating Loss SHALL display "—" instead of a numeric value.

---

### Requirement 8: Rating History Chart

**User Story:** As a user, I want to see my full rating history as a line chart, so that I can understand my progression over time.

#### Acceptance Criteria

1. THE Rating_History_Chart SHALL plot contest date (formatted as "MMM yyyy") on the X-axis and numeric rating on the Y-axis.
2. THE Rating_History_Chart SHALL fill the area under the line with a vertical gradient from the line's accent color at full opacity to transparent at the bottom.
3. THE Rating_History_Chart SHALL render colored horizontal band overlays for each RATING_BANDS entry, drawn as Chart.js annotation plugin boxes behind the line.
4. WHEN the user hovers a data point, THE Rating_History_Chart SHALL display a tooltip showing the contest name, the rating value, and the delta (formatted as "+N" or "−N").
5. THE Rating_History_Chart SHALL support zoom (scroll-wheel) and pan (click-drag) via the `chartjs-plugin-zoom` plugin.
6. WHEN there is only one contest data point, THE Rating_History_Chart SHALL render a single point marker instead of a line.

---

### Requirement 9: Rating Change Bar Chart

**User Story:** As a user, I want to see rating changes per contest as a bar chart, so that I can identify my best and worst performances.

#### Acceptance Criteria

1. THE Rating_Change_Chart SHALL render one bar per contest, ordered chronologically left to right.
2. WHEN a bar represents a positive rating change (delta > 0), THE Rating_Change_Chart SHALL color it green (`#22c55e`).
3. WHEN a bar represents a negative or zero rating change (delta ≤ 0), THE Rating_Change_Chart SHALL color it red (`#ef4444`).
4. WHEN the user hovers a bar, THE Rating_Change_Chart SHALL display a tooltip showing the contest name, old rating, new rating, and the delta formatted as "+N" or "−N".
5. WHEN there are more than 50 contests, THE Rating_Change_Chart SHALL enable horizontal scrolling within the chart container rather than compressing bars below 4 px width.

---

### Requirement 10: Contest Timeline Table

**User Story:** As a user, I want a sortable, paginated table of all contests, so that I can review historical contest results in detail.

#### Acceptance Criteria

1. THE Contest_Table SHALL display columns: Contest Name, Date (formatted "MMM d, yyyy"), Rank, Old Rating, New Rating, and Δ (rating delta).
2. WHEN the user clicks a column header, THE Contest_Table SHALL sort all rows by that column, toggling between ascending and descending order on successive clicks and displaying a sort direction indicator in the header.
3. THE Contest_Table SHALL display 20 rows per page and render pagination controls (Previous, page numbers, Next) below the table.
4. THE Contest_Table SHALL color each Δ cell with green text for positive values and red text for negative values.
5. WHEN the contest list contains more than 100 rows, THE Contest_Table SHALL virtualize its row rendering using `react-window` to maintain scroll performance.

---

### Requirement 11: Contest Analytics Grid

**User Story:** As a user, I want aggregated contest statistics, so that I can understand my overall contest performance patterns.

#### Acceptance Criteria

1. THE Contest_Analytics section SHALL display: Total Contests, Average Rank (rounded to nearest integer), Median Rank, Best Rank (lowest numeric rank value), Worst Rank (highest numeric rank value), Largest Gain (maximum positive delta), Largest Drop (maximum negative delta as absolute value), and Consistency Score.
2. THE Consistency_Score SHALL be computed as `1 - (stddev(ratingChanges) / mean(abs(ratingChanges)))` and displayed rounded to 2 decimal places.
3. WHEN there are zero contests, THE Contest_Analytics section SHALL display a centered empty-state message reading "No contest data available."
4. WHEN the Consistency_Score computation would produce a division-by-zero (all rating changes are 0), THE Contest_Analytics section SHALL display "N/A" for the Consistency Score.

---

### Requirement 12: Submission Statistics

**User Story:** As a user, I want a breakdown of all my submissions by verdict, so that I can see how often I solve problems on the first attempt.

#### Acceptance Criteria

1. THE Submission_Stats section SHALL display counts for: Total, AC, WA, TLE, MLE, RE, CE, and Other verdicts; "Other" SHALL aggregate all verdict types not in the preceding list.
2. THE Submission_Stats section SHALL render a doughnut chart on the left and a stat grid on the right, laid out side by side on viewports ≥ 768 px and stacked vertically on narrower viewports.
3. WHEN there are zero submissions, THE Submission_Stats section SHALL display a centered empty-state illustration with the text "No submissions yet."
4. EACH verdict in the doughnut chart SHALL use a distinct, predefined color consistent across the chart and stat grid labels.

---

### Requirement 13: Language Breakdown

**User Story:** As a user, I want to see which programming languages I use most, so that I can understand my tooling preferences.

#### Acceptance Criteria

1. THE Language_Breakdown section SHALL render a pie chart where each slice represents one programming language, sized proportionally to its share of total submissions.
2. THE Language_Breakdown section SHALL render a bar chart listing all languages with at least 1 submission, sorted by submission count descending, with each bar labeled with the count.
3. THE Language_Breakdown section SHALL display a badge identifying the top language by submission count; the badge SHALL show the language name and its submission count.
4. WHEN a user has submissions in only one language, THE Language_Breakdown section SHALL still render both charts with a single-slice pie and a single bar.
5. WHEN there are zero submissions, THE Language_Breakdown section SHALL display a centered empty-state message.

---

### Requirement 14: Problem Solving Stats

**User Story:** As a user, I want aggregated problem-solving statistics, so that I can track my overall problem-solving progress.

#### Acceptance Criteria

1. THE Problem_Stats section SHALL display: Total Solved (count of AC submissions), Unique Solved (count of distinct `contestId + index` keys among AC submissions), Average Difficulty (mean rating of uniquely-solved problems with a known rating, rounded to nearest integer), and Highest Difficulty Solved (maximum rating among uniquely-solved problems with a known rating).
2. THE Problem_Stats section SHALL render a histogram of uniquely-solved problems grouped into 100-point bins from 800 to 3500, with bins labeled "800", "900", …, "3500" on the X-axis and submission count on the Y-axis.
3. WHEN a solved problem has no rating field, THE Problem_Stats section SHALL exclude it from Average Difficulty and Highest Difficulty Solved calculations.
4. WHEN there are zero solved problems, THE Problem_Stats section SHALL display "—" for Average Difficulty and Highest Difficulty Solved, and render an empty histogram with all bins at zero.

---

### Requirement 15: Tag Analysis

**User Story:** As a user, I want to see how many problems I've solved per topic tag, so that I can understand my subject-matter coverage.

#### Acceptance Criteria

1. THE Tag_Analysis section SHALL count solved problems per tag by iterating over AC submissions, deduplicating problems by `problemId = contestId + index`, and then counting each tag that appears on those unique problems.
2. THE Tag_Analysis section SHALL render a horizontal bar chart of the top 20 tags sorted by solve count descending, with the tag name on the Y-axis and solve count on the X-axis.
3. EACH bar SHALL be labeled with its numeric solve count at the end of the bar.
4. WHEN the user has solved problems with fewer than 20 distinct tags, THE Tag_Analysis section SHALL render only the available tags without padding to 20.

---

### Requirement 16: Weak Topics

**User Story:** As a user, I want to identify my weakest topic areas, so that I know where to focus my practice.

#### Acceptance Criteria

1. THE Weak_Topics section SHALL identify the bottom 5 tags by solve count among tags with at least 1 attempted problem.
2. EACH weak topic SHALL be displayed as a card with a "Practice →" button linking to the Codeforces problem search filtered by that tag.

---

### Requirement 17: Strong Topics

**User Story:** As a user, I want to see my strongest topic areas, so that I can understand where I excel.

#### Acceptance Criteria

1. THE Strong_Topics section SHALL display the top 10 tags by solve count as badge-style cards showing the solve count.

---

### Requirement 18: Activity Heatmap

**User Story:** As a user, I want a GitHub-style activity heatmap, so that I can visualize my submission frequency over the past year.

#### Acceptance Criteria

1. THE Activity_Heatmap SHALL render a `react-calendar-heatmap` covering the last 365 days.
2. THE Activity_Heatmap SHALL count only AC submissions per calendar day, normalized to `yyyy-MM-dd` format using date-fns `format()`.
3. WHEN the user hovers a day cell, THE Activity_Heatmap SHALL display a tooltip showing submission count and the date.
4. THE Activity_Heatmap SHALL use a GitHub-style color scale (4–5 intensity levels).

---

### Requirement 19: Activity Charts

**User Story:** As a user, I want charts breaking down submission activity by day of week, calendar month, and year, so that I can identify my most and least active periods.

#### Acceptance Criteria

1. THE Daily_Activity_Chart SHALL render a bar chart of submission counts grouped by day of week (Monday through Sunday).
2. THE Monthly_Activity_Chart SHALL render a line chart of submission counts grouped by calendar month.
3. THE Yearly_Activity_Chart SHALL render a bar chart of submission counts grouped by year.

---

### Requirement 20: Verdict Distribution

**User Story:** As a user, I want a dedicated verdict distribution chart, so that I can see the full picture of my submission outcomes.

#### Acceptance Criteria

1. THE Verdict_Distribution section SHALL render a doughnut or pie chart with a distinct color per verdict type.

---

### Requirement 21: Problem Rating Distribution

**User Story:** As a user, I want a histogram of the ratings of problems I've solved, so that I can see my difficulty-level distribution at a glance.

#### Acceptance Criteria

1. THE Problem_Rating_Distribution section SHALL render a histogram of accepted-only problems binned in 100-point intervals from 800 to 3500.

---

### Requirement 22: AI Insights

**User Story:** As a user, I want automatically generated insights about my performance, so that I can learn things I might not notice from the raw charts alone.

#### Acceptance Criteria

1. THE AI_Insights section SHALL generate at least 10 insights from computed statistics without calling any external API.
2. EACH insight SHALL be rendered as an animated card with a lightbulb icon.
3. THE AI_Insights section SHALL derive insights from fields including but not limited to: rating trend, most-used language, weakest/strongest tags, submission frequency, and consistency score.

---

### Requirement 23: Practice Recommendations

**User Story:** As a user, I want personalized problem recommendations, so that I can practice at the right difficulty level on topics I need to improve.

#### Acceptance Criteria

1. THE Practice_Recommendations section SHALL filter problems from `getProblemset()` to exclude problems the user has already solved.
2. THE Practice_Recommendations section SHALL include only problems whose rating is within ±200 of the user's current rating.
3. THE Practice_Recommendations section SHALL prioritize problems whose tags overlap with the user's Weak_Topics.
4. THE Practice_Recommendations section SHALL display up to 20 recommended problems showing: Problem Name, Rating, Tags, and a "Solve →" link to the Codeforces problem page.

---

### Requirement 24: Achievements

**User Story:** As a user, I want to see achievement badges for my milestones, so that I feel rewarded for my progress.

#### Acceptance Criteria

1. THE Achievements section SHALL evaluate each badge defined in BADGE_DEFINITIONS using the current computed stats.
2. WHEN a badge's condition is met, THE Achievements section SHALL display it as unlocked with full color.
3. WHEN a badge's condition is not met, THE Achievements section SHALL display it as a grayed-out locked badge.
4. THE Achievements section SHALL include badges for: First AC, 10/50/100/500/1000 ACs, First Contest, 10/50 Contests, and each Codeforces rank tier reached.

---

### Requirement 25: Download as PDF

**User Story:** As a user, I want to download the dashboard as a PDF, so that I can share or archive my analytics.

#### Acceptance Criteria

1. THE Dashboard SHALL render a "Download as PDF" button.
2. WHEN the user clicks "Download as PDF", THE Dashboard SHALL call `window.print()`.
3. THE Dashboard SHALL include a print-specific CSS stylesheet that formats the dashboard for paper output without requiring an external PDF library.

---

### Requirement 26: Error Handling

**User Story:** As a user, I want clear, actionable error states for every failure mode, so that I always know what went wrong and what to do next.

#### Acceptance Criteria

1. WHEN the submitted handle returns a 400 from the API, THE Dashboard SHALL display a "No user found" card with a "Search Again" call-to-action.
2. WHEN a network failure occurs, THE Dashboard SHALL display a toast notification and a retry button.
3. WHEN the API returns status 429, THE Dashboard SHALL display a countdown timer showing seconds until the request can be retried.
4. WHEN a user has zero contests or zero submissions, THE Dashboard SHALL display an empty-state illustration for the affected section.
5. WHEN one or more API calls fail while others succeed, THE Dashboard SHALL render all available sections and display a warning banner listing the failed endpoints.

---

### Requirement 27: Performance

**User Story:** As a developer, I want performance best-practices applied throughout, so that the dashboard is responsive and does not re-render unnecessarily.

#### Acceptance Criteria

1. EVERY chart component SHALL be wrapped with `React.memo`.
2. ALL stat computations SHALL be wrapped with `useMemo`.
3. ALL event handlers SHALL be wrapped with `useCallback`.
4. THE Dashboard page component SHALL be loaded via `React.lazy` and wrapped in `React.Suspense`.
5. WHEN the contest table contains more than 100 rows, THE Contest_Table SHALL virtualize its rows using `react-window`.

---

### Requirement 28: Constants

**User Story:** As a developer, I want centralized constants, so that rank colors, tag lists, badge definitions, and rating bands are defined in one place and reused consistently.

#### Acceptance Criteria

1. THE Constants module SHALL define `RANK_COLORS` mapping each rank tier name (Newbie through Legendary Grandmaster) to a hex color value.
2. THE Constants module SHALL define `TAG_LIST` containing at least 35 common Codeforces problem tags.
3. THE Constants module SHALL define `BADGE_DEFINITIONS` as an array of objects with fields `{ id, label, icon, condition(stats) }`.
4. THE Constants module SHALL define `RATING_BANDS` as an array of objects with fields `{ label, min, max, color }`.

---

### Requirement 29: Folder Structure

**User Story:** As a developer, I want a strictly enforced folder structure, so that the codebase is predictable and easy to navigate.

#### Acceptance Criteria

1. THE Project SHALL organize chart wrapper components under `src/charts/`.
2. THE Project SHALL organize reusable UI primitives (Button, Card, Badge, Skeleton, Tooltip) under `src/components/ui/`.
3. THE Project SHALL organize layout components (Sidebar, Navbar, PageWrapper) under `src/components/layout/`.
4. THE Project SHALL organize custom hooks under `src/hooks/`.
5. THE Project SHALL organize page components under `src/pages/`.
6. THE Project SHALL organize the Axios instance and API functions under `src/services/`.
7. THE Project SHALL organize global CSS and Tailwind config under `src/styles/`.
8. THE Project SHALL organize data transformers and stat calculators under `src/utils/`.

---

### Requirement 30: Chart Standards

**User Story:** As a developer, I want all charts to follow a consistent visual and technical standard, so that the dashboard looks cohesive and charts work correctly.

#### Acceptance Criteria

1. THE Project SHALL register all Chart.js components globally in `main.jsx` before any chart renders.
2. EVERY chart SHALL use a transparent canvas background.
3. EVERY chart SHALL render grid lines with color `rgba(255,255,255,0.05)`.
4. EVERY chart SHALL be configured with `responsive: true` and `maintainAspectRatio: false`.
5. WHERE a gradient fill is used, THE Chart SHALL create it via `ctx.createLinearGradient`.
6. EVERY chart SHALL animate on mount using Chart.js animation configuration.
