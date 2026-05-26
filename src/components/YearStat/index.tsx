import { lazy, Suspense } from 'react';
import Stat from '@/components/Stat';
import WorkoutStat from '@/components/WorkoutStat';
import useActivities from '@/hooks/useActivities';
import type { Activity } from '@/utils/utils';
import { formatPace, colorFromType } from '@/utils/utils';
import useHover from '@/hooks/useHover';
import { yearStats, githubYearStats } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import { DIST_UNIT, M_TO_DIST, M_TO_ELEV, ELEV_UNIT } from '@/utils/utils';

const yearSvgs = Object.fromEntries(
  Object.keys(yearStats).map((path) => [
    path,
    lazy(() => loadSvgComponent(yearStats, path)),
  ])
);

const githubYearSvgs = Object.fromEntries(
  Object.keys(githubYearStats).map((path) => [
    path,
    lazy(() => loadSvgComponent(githubYearStats, path)),
  ])
);

interface YearStatAccumulator {
  averageHeartRateTotal: number;
  heartRateNullCount: number;
  runCount: number;
  streak: number;
  totalDistance: number;
  totalElevationGain: number;
  totalMetersForPace: number;
  totalSecondsForPace: number;
  workoutsCounts: Map<string, number[]>; // type -> [count, seconds, meters]
}

interface YearStatSummary {
  averageHeartRate: string;
  averagePace: string;
  hasHeartRate: boolean;
  runCount: number;
  streak: number;
  totalDistance: number;
  totalElevationGain: string;
  workoutsStat: Map<string, string[]>; // type -> [count, seconds, meters]
}

const createAccumulator = (): YearStatAccumulator => ({
  averageHeartRateTotal: 0,
  heartRateNullCount: 0,
  runCount: 0,
  streak: 0,
  totalDistance: 0,
  totalElevationGain: 0,
  totalMetersForPace: 0,
  totalSecondsForPace: 0,
  workoutsCounts: new Map<string, number[]>(),
});

const addRunToAccumulator = (
  accumulator: YearStatAccumulator,
  run: Activity
) => {
  accumulator.runCount += 1;
  accumulator.totalDistance += run.distance || 0;
  accumulator.totalElevationGain += run.elevation_gain || 0;

  if (run.average_speed) {
    accumulator.totalMetersForPace += run.distance || 0;
    accumulator.totalSecondsForPace += (run.distance || 0) / run.average_speed;
    if (accumulator.workoutsCounts.has(run.type)) {
      const [oriCount, oriSecondsAvail, oriMetersAvail] =
        accumulator.workoutsCounts.get(run.type)!;
      accumulator.workoutsCounts.set(run.type, [
        oriCount + 1,
        oriSecondsAvail + (run.distance || 0) / run.average_speed,
        oriMetersAvail + (run.distance || 0),
      ]);
    } else {
      accumulator.workoutsCounts.set(run.type, [
        1,
        (run.distance || 0) / run.average_speed,
        run.distance || 0,
      ]);
    }
  }

  if (run.average_heartrate) {
    accumulator.averageHeartRateTotal += run.average_heartrate;
  } else {
    accumulator.heartRateNullCount += 1;
  }
};

const maxConsecutiveActivityDays = (runs: Activity[]) => {
  const timestamps = Array.from(
    new Set(
      runs
        .map((run) => run.start_date_local?.slice(0, 10))
        .filter(Boolean)
        .map((date) => new Date(`${date}T00:00:00`).getTime())
    )
  ).sort((a, b) => a - b);

  let maxStreak = 0;
  let currentStreak = 0;
  let previousTimestamp: number | null = null;
  const oneDay = 24 * 60 * 60 * 1000;

  timestamps.forEach((timestamp) => {
    if (
      previousTimestamp === null ||
      timestamp !== previousTimestamp + oneDay
    ) {
      currentStreak = 1;
    } else {
      currentStreak += 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    previousTimestamp = timestamp;
  });

  return maxStreak;
};

const finalizeYearStat = (
  accumulator: YearStatAccumulator
): YearStatSummary => {
  const heartRateCount = accumulator.runCount - accumulator.heartRateNullCount;
  const workoutsStat = new Map<string, string[]>();

  accumulator.workoutsCounts.forEach((counts, _type) => {
    workoutsStat.set(_type, [
      counts[0].toString(),
      counts[1].toString(),
      (counts[2] / 1000.0).toFixed(0).toString(),
    ]);
  });
  return {
    averageHeartRate: (
      accumulator.averageHeartRateTotal / heartRateCount
    ).toFixed(0),
    averagePace: formatPace(
      accumulator.totalMetersForPace / accumulator.totalSecondsForPace
    ),
    hasHeartRate: accumulator.averageHeartRateTotal !== 0,
    runCount: accumulator.runCount,
    streak: accumulator.streak,
    totalDistance: parseFloat(
      (accumulator.totalDistance / M_TO_DIST).toFixed(1)
    ),
    totalElevationGain: (accumulator.totalElevationGain * M_TO_ELEV).toFixed(0),
    workoutsStat: workoutsStat,
  };
};

const yearStatCache = new WeakMap<Activity[], Map<string, YearStatSummary>>();

const getYearStatSummaries = (activityData: Activity[]) => {
  const cachedSummaries = yearStatCache.get(activityData);
  if (cachedSummaries) return cachedSummaries;

  const accumulators = new Map<string, YearStatAccumulator>();
  const runsByYear = new Map<string, Activity[]>();
  accumulators.set('Total', createAccumulator());
  runsByYear.set('Total', []);

  activityData.forEach((run) => {
    const year = run.start_date_local.slice(0, 4);
    if (!accumulators.has(year)) {
      accumulators.set(year, createAccumulator());
      runsByYear.set(year, []);
    }
    addRunToAccumulator(accumulators.get('Total')!, run);
    addRunToAccumulator(accumulators.get(year)!, run);
    runsByYear.get('Total')!.push(run);
    runsByYear.get(year)!.push(run);
  });

  const summaries = new Map(
    Array.from(accumulators, ([year, accumulator]) => {
      accumulator.streak = maxConsecutiveActivityDays(runsByYear.get(year)!);
      return [year, finalizeYearStat(accumulator)];
    })
  );
  yearStatCache.set(activityData, summaries);
  return summaries;
};

const YearStat = ({
  year,
  onClick,
  onClickTypeInYear,
}: {
  year: string;
  onClick: (_year: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
}) => {
  const { activities: runs, years } = useActivities();
  // for hover
  const [hovered, eventHandlers] = useHover();
  // lazy Component
  const YearSVG = yearSvgs[`./year_${year}.svg`];
  const GithubYearSVG = githubYearSvgs[`./github_${year}.svg`];
  const summary = getYearStatSummaries(runs).get(year);

  if (!summary) return null;

  return (
    <div className="cursor-pointer" onClick={() => onClick(year)}>
      <section {...eventHandlers}>
        <Stat value={year} description=" Journey" />
        {summary.totalDistance > 0 && (
          <WorkoutStat
            key="total"
            value={summary.runCount}
            description={' Total'}
            distance={summary.totalDistance}
          />
        )}
        {Array.from(summary.workoutsStat).map(([type, count]) => (
          <WorkoutStat
            key={type}
            value={count[0]}
            description={` ${type}` + 's'}
            // pace={formatPace(count[2] / count[1])}
            distance={count[2]}
            // color={colorFromType(type)}
            onClick={(e: Event) => {
              onClickTypeInYear(year, type);
              e.stopPropagation();
            }}
          />
        ))}
        {SHOW_ELEVATION_GAIN && summary.totalElevationGain > 0 && (
          <Stat
            value={`${summary.totalElevationGain} `}
            description={`${ELEV_UNIT} Elev Gain`}
            className="pb-2"
          />
        )}
        <Stat
          value={`${summary.streak} day`}
          description=" Streak"
          className="pb-2"
        />
        {summary.hasHeartRate && (
          <Stat
            value={summary.averageHeartRate}
            description=" Avg Heart Rate"
          />
        )}
      </section>
      {year !== 'Total' && hovered && YearSVG && GithubYearSVG && (
        <Suspense fallback="loading...">
          <YearSVG className="year-svg my-4 h-4/6 w-4/6 border-0 p-0" />
          <GithubYearSVG className="github-year-svg my-4 h-auto w-full border-0 p-0" />
        </Suspense>
      )}
      <hr />
    </div>
  );
};

export default YearStat;
