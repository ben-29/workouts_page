import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';
import type { Activity } from '@/utils/utils';
import { formatPace } from '@/utils/utils';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import { DIST_UNIT, M_TO_DIST, M_TO_ELEV, ELEV_UNIT } from '@/utils/utils';

interface YearStatAccumulator {
  averageHeartRateTotal: number;
  activeDates: Set<string>;
  heartRateNullCount: number;
  runCount: number;
  totalDistance: number;
  totalElevationGain: number;
  totalMetersForPace: number;
  totalSecondsForPace: number;
  workoutsCounts: Map<string, number[]>; // type -> [count, seconds, meters]
}

interface YearStatSummary {
  averageHeartRate: string;
  averagePace: string;
  activeDays: number;
  hasHeartRate: boolean;
  runCount: number;
  totalDistance: number;
  totalElevationGain: string;
  workoutsStat: Map<string, string[]>; // type -> [count, seconds, meters]
}

const createAccumulator = (): YearStatAccumulator => ({
  averageHeartRateTotal: 0,
  activeDates: new Set<string>(),
  heartRateNullCount: 0,
  runCount: 0,
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
  if (run.start_date_local) {
    accumulator.activeDates.add(run.start_date_local.slice(0, 10));
  }
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
    activeDays: accumulator.activeDates.size,
    hasHeartRate: accumulator.averageHeartRateTotal !== 0,
    runCount: accumulator.runCount,
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
  accumulators.set('Total', createAccumulator());

  activityData.forEach((run) => {
    const year = run.start_date_local.slice(0, 4);
    if (!accumulators.has(year)) {
      accumulators.set(year, createAccumulator());
    }
    addRunToAccumulator(accumulators.get('Total')!, run);
    addRunToAccumulator(accumulators.get(year)!, run);
  });

  const summaries = new Map(
    Array.from(accumulators, ([year, accumulator]) => [
      year,
      finalizeYearStat(accumulator),
    ])
  );
  yearStatCache.set(activityData, summaries);
  return summaries;
};

const YearStat = ({
  year,
  onClick,
  onClickTypeInYear,
  showDivider = true,
}: {
  year: string;
  onClick: (_year: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
  showDivider?: boolean;
}) => {
  const { activities: runs } = useActivities();
  void onClick;
  void onClickTypeInYear;
  const summary = getYearStatSummaries(runs).get(year);

  if (!summary) return null;

  return (
    <div>
      <section>
        <Stat value={year} description=" Journey" />
        <Stat value={summary.runCount} description=" Activities" />
        <Stat
          value={summary.totalDistance}
          description={` ${DIST_UNIT}`}
          format="comma"
        />
        {SHOW_ELEVATION_GAIN && summary.totalElevationGain > 0 && (
          <Stat
            value={summary.totalElevationGain}
            description={` ${ELEV_UNIT} Elev Gain`}
            className="w-full pb-1"
            format="comma"
          />
        )}
        <Stat value={summary.averagePace} description=" Avg Pace" />
        <Stat value={summary.activeDays} description=" Active Days" />
        {summary.hasHeartRate && (
          <Stat
            value={summary.averageHeartRate}
            description=" Avg Heart Rate"
          />
        )}
      </section>
      {showDivider && <hr className="my-5 border-neutral-300" />}
    </div>
  );
};

export default YearStat;
