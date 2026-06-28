import fc from 'fast-check';
import type { CFSubmission, CFProblem, CFRatingChange } from '../../types';

const VERDICTS = [
  'OK',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILATION_ERROR',
  'SKIPPED',
  'CHALLENGED',
  undefined,
];

export const problemArb: fc.Arbitrary<CFProblem> = fc.record({
  contestId: fc.integer({ min: 1, max: 2000 }),
  index: fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F'),
  name: fc.string({ minLength: 1, maxLength: 12 }),
  type: fc.constant('PROGRAMMING'),
  rating: fc.option(fc.integer({ min: 800, max: 3500 }), { nil: undefined }),
  tags: fc.array(fc.constantFrom('dp', 'math', 'graphs', 'greedy', 'strings'), {
    maxLength: 4,
  }),
});

export const submissionArb: fc.Arbitrary<CFSubmission> = fc
  .tuple(
    fc.integer({ min: 1, max: 1_000_000 }),
    fc.integer({ min: 1_500_000_000, max: 1_700_000_000 }),
    problemArb,
    fc.constantFrom('GNU C++17', 'Python 3', 'Java 8', 'Rust', 'Kotlin'),
    fc.constantFrom(...VERDICTS),
  )
  .map(([id, creationTimeSeconds, problem, programmingLanguage, verdict]) => ({
    id,
    creationTimeSeconds,
    problem,
    programmingLanguage,
    verdict,
    author: { members: [{ handle: 'tester' }] },
    passedTestCount: 0,
    timeConsumedMillis: 0,
    memoryConsumedBytes: 0,
  }));

export const ratingChangeArb: fc.Arbitrary<CFRatingChange> = fc
  .tuple(
    fc.integer({ min: 1, max: 2000 }),
    fc.integer({ min: 1, max: 50000 }),
    fc.integer({ min: 1_500_000_000, max: 1_700_000_000 }),
    fc.integer({ min: 0, max: 3500 }),
    fc.integer({ min: -500, max: 500 }),
  )
  .map(([contestId, rank, ratingUpdateTimeSeconds, oldRating, delta]) => ({
    contestId,
    contestName: `Round ${contestId}`,
    handle: 'tester',
    rank,
    ratingUpdateTimeSeconds,
    oldRating,
    newRating: oldRating + delta,
  }));
