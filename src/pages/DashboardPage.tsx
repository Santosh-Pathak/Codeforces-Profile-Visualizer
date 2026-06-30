import { useCallback, useMemo, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useCodeforcesData } from '../hooks/useCodeforcesData';
import { computeComputedStats } from '../utils/statCalculators';
import { fadeSlideUp } from '../utils/motionVariants';

import PageWrapper from '../components/layout/PageWrapper';
import Sidebar from '../components/layout/Sidebar';
import MobileNav from '../components/layout/MobileNav';
import SectionHeader from '../components/layout/SectionHeader';
import { CodeforcesDataProvider } from '../contexts/CodeforcesDataContext';

import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';
import ErrorBoundary from '../components/ui/ErrorBoundary';

import ProfileCard from '../components/ProfileCard';
import SummaryStats from '../components/SummaryStats';
import ContestTable from '../components/ContestTable';
import ContestAnalytics from '../components/ContestAnalytics';
import SubmissionStats from '../components/SubmissionStats';
import ProblemStats from '../components/ProblemStats';
import WeakTopics from '../components/WeakTopics';
import StrongTopics from '../components/StrongTopics';
import ActivityHeatmap from '../components/ActivityHeatmap';
import AiInsights from '../components/AiInsights';
import PracticeRecommendations from '../components/PracticeRecommendations';
import Achievements from '../components/Achievements';
import DownloadPdfButton from '../components/DownloadPdfButton';
import WarningBanner from '../components/WarningBanner';
import RateLimitTimer from '../components/RateLimitTimer';

import RatingHistoryChart from '../charts/RatingHistoryChart';
import RatingChangeChart from '../charts/RatingChangeChart';
import LanguageBreakdown from '../charts/LanguageBreakdown';
import TagAnalysis from '../charts/TagAnalysis';
import DailyActivityChart from '../charts/DailyActivityChart';
import MonthlyActivityChart from '../charts/MonthlyActivityChart';
import YearlyActivityChart from '../charts/YearlyActivityChart';
import VerdictDistribution from '../charts/VerdictDistribution';
import ProblemRatingDistribution from '../charts/ProblemRatingDistribution';

interface SectionProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

function Section({ id, title, subtitle, children, className = '' }: SectionProps) {
  return (
    <motion.section
      id={id}
      variants={fadeSlideUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className={`dashboard-section scroll-mt-6 ${className}`}
    >
      <SectionHeader title={title} subtitle={subtitle} />
      <ErrorBoundary label={`Could not render ${title}.`}>{children}</ErrorBoundary>
    </motion.section>
  );
}

export default function DashboardPage() {
  const { handle = '' } = useParams();
  const navigate = useNavigate();
  const data = useCodeforcesData(handle);
  const {
    profile,
    contests,
    submissions,
    problems,
    loading,
    loadingMore,
    error,
    status,
    retryAfter,
    refetch,
  } = data;

  const computedStats = useMemo(
    () => computeComputedStats(profile, contests, submissions, problems),
    [profile, contests, submissions, problems],
  );

  const handleRefetch = useCallback(() => refetch(), [refetch]);
  const handleSearchAgain = useCallback(() => navigate('/'), [navigate]);

  // 400 — user not found
  if (status === 400) {
    return (
      <PageWrapper>
        <div className="flex min-h-screen items-center justify-center p-6">
          <GlassCard className="max-w-md p-8 text-center">
            <h2 className="text-xl font-bold">No user found</h2>
            <p className="mt-2 text-white/60">
              We couldn&apos;t find a Codeforces user with the handle
              {' '}
              <span className="font-mono text-white">{handle}</span>.
            </p>
            <Button variant="primary" className="mt-6" onClick={handleSearchAgain}>
              Search Again
            </Button>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  // 429 — rate limited
  if (status === 429 && retryAfter != null) {
    return (
      <PageWrapper>
        <RateLimitTimer retryAfter={retryAfter} onRetry={handleRefetch} />
      </PageWrapper>
    );
  }

  // Loading
  if (loading) {
    return (
      <PageWrapper loading>
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  // All failed
  const allFailed = !profile && !contests && !submissions;
  if (allFailed) {
    return (
      <PageWrapper>
        <div className="flex min-h-screen items-center justify-center p-6">
          <GlassCard className="max-w-md p-8 text-center">
            <h2 className="text-xl font-bold text-red-300">Network Error</h2>
            <p className="mt-2 text-white/60">
              {error ?? 'Could not load data. Please try again.'}
            </p>
            <Button variant="primary" className="retry-btn mt-6" onClick={handleRefetch}>
              Retry
            </Button>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  const partialFailure = error != null;

  return (
    <PageWrapper loading={loading}>
      <CodeforcesDataProvider value={data}>
        <MobileNav />
        <div className="dashboard-shell">
          <Sidebar profile={profile} />
          <main className="dashboard-main dashboard-grid min-w-0 space-y-10 px-4 py-8 sm:px-6 lg:px-10">
            {partialFailure && <WarningBanner message={error} />}
            {loadingMore && (
              <div className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
        
              </div>
            )}

          <div className="flex items-center justify-between pr-12 lg:pr-14">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {handle}
              </span>
            </h1>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleRefetch} className="refresh-btn">
                Refresh
              </Button>
              <DownloadPdfButton />
            </div>
          </div>

          {profile && (
            <section id="profile" className="dashboard-section scroll-mt-6">
              <ErrorBoundary label="Could not render profile.">
                <ProfileCard profile={profile} />
              </ErrorBoundary>
            </section>
          )}

          <Section id="summary-stats" title="Summary">
            <SummaryStats contests={contests} profile={profile} />
          </Section>

          <Section id="rating-history" title="Rating History">
            <GlassCard className="p-5">
              <RatingHistoryChart contests={contests} />
            </GlassCard>
          </Section>

          <Section id="rating-changes" title="Rating Changes">
            <GlassCard className="p-5">
              <RatingChangeChart contests={contests} />
            </GlassCard>
          </Section>

          <Section id="contest-table" title="Contest Timeline">
            <ContestTable contests={contests} />
          </Section>

          <Section id="contest-analytics" title="Contest Analytics">
            <ContestAnalytics contests={contests} />
          </Section>

          <Section id="submissions" title="Submission Statistics">
            <SubmissionStats submissions={submissions} />
          </Section>

          <Section id="languages" title="Language Breakdown">
            <GlassCard className="p-5">
              <LanguageBreakdown submissions={submissions} />
            </GlassCard>
          </Section>

          <Section id="problems" title="Problem Solving">
            <ProblemStats submissions={submissions} problems={problems} />
          </Section>

          <Section id="tags" title="Tag Analysis">
            <GlassCard className="p-5">
              <TagAnalysis submissions={submissions} />
            </GlassCard>
          </Section>

          <Section id="weak-topics" title="Weak Topics">
            <WeakTopics submissions={submissions} />
          </Section>

          <Section id="strong-topics" title="Strong Topics">
            <StrongTopics submissions={submissions} />
          </Section>

          <Section id="activity-heatmap" title="Activity Heatmap">
            <ActivityHeatmap submissions={submissions} />
          </Section>

          <Section id="daily-activity" title="Activity by Weekday">
            <GlassCard className="p-5">
              <DailyActivityChart submissions={submissions} />
            </GlassCard>
          </Section>

          <Section id="monthly-activity" title="Activity by Month">
            <GlassCard className="p-5">
              <MonthlyActivityChart submissions={submissions} />
            </GlassCard>
          </Section>

          <Section id="yearly-activity" title="Activity by Year">
            <GlassCard className="p-5">
              <YearlyActivityChart submissions={submissions} />
            </GlassCard>
          </Section>

          <Section id="verdict-distribution" title="Verdict Distribution">
            <GlassCard className="p-5">
              <VerdictDistribution submissions={submissions} />
            </GlassCard>
          </Section>

          <Section id="problem-rating" title="Problem Rating Distribution">
            <GlassCard className="p-5">
              <ProblemRatingDistribution
                submissions={submissions}
                problems={problems}
              />
            </GlassCard>
          </Section>

          <Section id="ai-insights" title="AI Insights">
            <AiInsights stats={computedStats} />
          </Section>

          <Section id="recommendations" title="Practice Recommendations">
            <PracticeRecommendations
              profile={profile}
              submissions={submissions}
              problems={problems}
            />
          </Section>

          <Section id="achievements" title="Achievements">
            <Achievements stats={computedStats} />
          </Section>
        </main>
      </div>
      </CodeforcesDataProvider>
    </PageWrapper>
  );
}
