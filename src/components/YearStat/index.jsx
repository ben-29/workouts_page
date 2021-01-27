import React from 'react';
import useHover from 'src/hooks/useHover';
import Stat from 'src/components/Stat';
import { formatPace } from 'src/utils/utils';
import useActivities from 'src/hooks/useActivities';
import styles from './style.module.scss';

const YearStat = ({ year, onClick }) => {
  let { activities: runs, years } = useActivities();
  // for hover
  const [hovered, eventHandlers] = useHover();
  // lazy Component
  const YearSVG = React.lazy(() =>
    import(`assets/year_${year}.svg`).catch(() => ({
      default: () => <div />,
    }))
  );

  if (years.includes(year)) {
    runs = runs.filter((run) => run.start_date_local.slice(0, 4) === year);
  }
  let sumDistance = 0;
  let streak = 0;
  let RunPace = 0;
  let RunCount = 0;
  let RidePace = 0;
  let RideCount = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  runs.forEach((run) => {
    sumDistance += run.distance || 0;
    if (run.average_speed) {
      switch(run.type){
        case 'Run':
          RunPace += run.average_speed;
          RunCount ++;
          break;
        case 'Ride':
          RidePace += run.average_speed;
          RideCount ++;
          break;
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
  sumDistance = (sumDistance / 1000.0).toFixed(1);
  if( RunCount > 0){
    RunPace = RunPace / RunCount;
  }
  if( RideCount > 0){
    RidePace = RidePace / RideCount;
  }
  const avgRunningPace = formatPace(RunPace);
  const avgRidingPace = formatPace(RidePace);
  const hasHeartRate = !(heartRate === 0);
  const avgHeartRate = (heartRate / (runs.length - heartRateNullCount)).toFixed(
    0
  );
  return (
    <div
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(year)}
      {...eventHandlers}
    >
      <section>
        <Stat value={year} description=" Journey" />
        <Stat value={runs.length} description=" Workouts" />
        <Stat value={sumDistance} description=" KM" />
        { avgRunningPace != '0' && (<Stat value={avgRunningPace} description=" Avg Running Pace" />)}
        { avgRidingPace != '0' && (<Stat value={avgRidingPace} description=" Avg Riding Pace" />)}
        <Stat
          value={`${streak} day`}
          description=" Streak"
          className="mb0 pb0"
        />
        {hasHeartRate && (
          <Stat value={avgHeartRate} description=" Avg Heart Rate" />
        )}
      </section>
      {hovered && (
        <React.Suspense fallback="loading...">
          <YearSVG className={styles.yearSVG} />
        </React.Suspense>
      )}
      <hr color="red" />
    </div>
  );
};

export default YearStat;
