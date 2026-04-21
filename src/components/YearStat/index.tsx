import React, { Suspense } from 'react';
import Stat from '@/components/Stat';
import WorkoutStat from '@/components/WorkoutStat';
import useActivities from '@/hooks/useActivities';
import useHover from '@/hooks/useHover';
import { yearStats } from '@assets/index';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import { loadSvgComponent } from '@/utils/svgUtils';

// Directly import github year SVG components
import { ReactComponent as Github2021Svg } from '../../../assets/github_2021.svg';
import { ReactComponent as Github2022Svg } from '../../../assets/github_2022.svg';
import { ReactComponent as Github2023Svg } from '../../../assets/github_2023.svg';
import { ReactComponent as Github2024Svg } from '../../../assets/github_2024.svg';
import { ReactComponent as Github2025Svg } from '../../../assets/github_2025.svg';
import { ReactComponent as Github2026Svg } from '../../../assets/github_2026.svg';

const GITHUB_YEAR_COMPONENTS: Record<string, React.ComponentType<any>> = {
  '2021': Github2021Svg,
  '2022': Github2022Svg,
  '2023': Github2023Svg,
  '2024': Github2024Svg,
  '2025': Github2025Svg,
  '2026': Github2026Svg,
};

// Fallback for years without github SVG
const NullSvg = () => null;

const YearStat = ({
  year,
  onClick,
  onClickTypeInYear,
}: {
  year: string;
  onClick: (_year: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
}) => {
  let { activities: runs, years } = useActivities();
  // for hover
  const [hovered, eventHandlers] = useHover();
  // SVG Components
  const YearSVG = loadSvgComponent(yearStats, `./year_${year}.svg`);
  const GithubYearSVG = GITHUB_YEAR_COMPONENTS[year] ?? NullSvg;

  if (years.includes(year)) {
    runs = runs.filter((run) => run.start_date_local.slice(0, 4) === year);
  }
  let sumDistance = 0;
  let streak = 0;
  let sumElevationGain = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  const workoutsCounts = {};

  runs.forEach((run) => {
    sumDistance += run.distance || 0;
    sumElevationGain += run.elevation_gain || 0;
    if (run.average_speed) {
      if (workoutsCounts[run.type]) {
        var [oriCount, oriSecondsAvail, oriMetersAvail] =
          workoutsCounts[run.type];
        workoutsCounts[run.type] = [
          oriCount + 1,
          oriSecondsAvail + (run.distance || 0) / run.average_speed,
          oriMetersAvail + (run.distance || 0),
        ];
      } else {
        workoutsCounts[run.type] = [
          1,
          (run.distance || 0) / run.average_speed,
          run.distance,
        ];
      }
    }
    if (run.average_heartrate) {
      heartRate += run.average_heartrate;
    } else {
      heartRateNullCount++;
    }
    if (run.streak) {
      streak = Math.max(streak, run.streak);
    }
  });
  sumDistance = parseFloat((sumDistance / M_TO_DIST).toFixed(0));
  const sumElevationGainStr = (sumElevationGain * M_TO_ELEV).toFixed(0);
  const hasHeartRate = !(heartRate === 0);
  const avgHeartRate = (heartRate / (runs.length - heartRateNullCount)).toFixed(
    0
  );

  const workoutsArr = Object.entries(workoutsCounts);
  workoutsArr.sort((a, b) => {
    return b[1][0] - a[1][0];
  });
  return (
    <div className="cursor-pointer" onClick={() => onClick(year)}>
      <section {...eventHandlers}>
        <Stat value={year} description=" Journey" />
        {sumDistance > 0 && (
          <WorkoutStat
            key="total"
            value={runs.length}
            description={' Total'}
            distance={sumDistance}
          />
        )}
        {workoutsArr.map(([type, count]) => (
          <WorkoutStat
            key={type}
            value={count[0]}
            description={` ${type}` + 's'}
            // pace={formatPace(count[2] / count[1])}
            distance={(count[2] / 1000.0).toFixed(0)}
            // color={colorFromType(type)}
            onClick={(e: Event) => {
              onClickTypeInYear(year, type);
              e.stopPropagation();
            }}
          />
        ))}
        {SHOW_ELEVATION_GAIN && sumElevationGain > 0 && (
          <Stat
            value={`${sumElevationGainStr} `}
            description={`${ELEV_UNIT} Elev Gain`}
            className="pb-2"
          />
        )}
        <Stat value={`${streak} day`} description=" Streak" className="pb-2" />
        {hasHeartRate && (
          <Stat value={avgHeartRate} description=" Avg Heart Rate" />
        )}
      </section>
      {year !== 'Total' && hovered && (
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
