import type { ComputedStats, Insight } from '../types';

/**
 * Generates a list of human-readable insights derived purely from computed
 * statistics. Always returns at least 10 entries.
 */
export function generateInsights(stats: ComputedStats): Insight[] {
  const insights: Insight[] = [];

  // 1. Rating trend
  if (stats.ratingTrend === 'up') {
    insights.push({ icon: 'trend-up', text: 'Your rating is trending upward over recent contests. Keep the momentum going!' });
  } else if (stats.ratingTrend === 'down') {
    insights.push({ icon: 'trend-down', text: 'Your rating has dipped recently. Consider revisiting fundamentals and steady practice.' });
  } else if (stats.ratingTrend === 'flat') {
    insights.push({ icon: 'trend-flat', text: 'Your rating has been stable recently. Pushing into slightly harder problems can break the plateau.' });
  } else {
    insights.push({ icon: 'trend-flat', text: 'Not enough contest history yet to detect a rating trend — join a few rounds!' });
  }

  // 2. Top language
  insights.push({
    icon: 'language',
    text: stats.topLanguage
      ? `Your most-used language is ${stats.topLanguage}.`
      : 'No submissions recorded yet, so no preferred language detected.',
  });

  // 3. Strongest tag
  insights.push({
    icon: 'strong',
    text: stats.strongTags.length
      ? `Your strongest topic is "${stats.strongTags[0]}" based on solve count.`
      : 'Solve some problems to reveal your strongest topics.',
  });

  // 4. Weakest tag
  insights.push({
    icon: 'weak',
    text: stats.weakTags.length
      ? `"${stats.weakTags[0]}" is among your least-practiced topics — a good area to improve.`
      : 'Attempt a wider variety of topics to surface your weak areas.',
  });

  // 5. Submission frequency
  insights.push({
    icon: 'frequency',
    text: stats.submissionFreq > 0
      ? `On active days you average ${stats.submissionFreq} submissions.`
      : 'Start submitting regularly to build a consistent practice habit.',
  });

  // 6. Consistency score
  insights.push({
    icon: 'consistency',
    text: stats.consistencyScore != null
      ? `Your contest consistency score is ${stats.consistencyScore.toFixed(2)} (higher is steadier).`
      : 'Consistency score will appear once you have rated contests.',
  });

  // 7. Average difficulty
  insights.push({
    icon: 'difficulty',
    text: stats.avgDifficulty != null
      ? `The average difficulty of problems you solve is around ${stats.avgDifficulty}.`
      : 'Solve rated problems to see your average difficulty.',
  });

  // 8. Highest difficulty
  insights.push({
    icon: 'peak',
    text: stats.highestDifficulty != null
      ? `Your hardest solved problem is rated ${stats.highestDifficulty} — impressive!`
      : 'Tackle a rated problem to set your difficulty record.',
  });

  // 9. Most active day
  insights.push({
    icon: 'calendar',
    text: stats.mostActiveDow
      ? `You submit most often on ${stats.mostActiveDow}.`
      : 'Your most active day will show after some submissions.',
  });

  // 10. Total solved
  insights.push({
    icon: 'solved',
    text: `You have ${stats.totalAC} accepted submissions across ${stats.uniqueSolved} unique problems.`,
  });

  // 11. Contest participation
  insights.push({
    icon: 'contests',
    text: stats.totalContests > 0
      ? `You've competed in ${stats.totalContests} rated contests.`
      : 'You have not joined a rated contest yet — give one a try!',
  });

  // 12. Best rank
  if (stats.bestRank != null) {
    insights.push({ icon: 'rank', text: `Your best contest rank is ${stats.bestRank}.` });
  }

  // 13. Biggest gain
  if (stats.highestGain != null && stats.highestGain > 0) {
    insights.push({ icon: 'gain', text: `Your largest single-contest rating gain was +${stats.highestGain}.` });
  }

  return insights;
}
