import React from 'react';
import useHover from 'src/hooks/useHover';
import Stat from 'src/components/Stat';
import WorkoutStat from 'src/components/WorkoutStat';
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
  let heartRate = 0;
  let heartRateNullCount = 0;
  let countsMap = new Map();
  let avgSpdMap = new Map();
  let distanceMap = new Map();
  runs.forEach((run) => {
    sumDistance += run.distance || 0;
    if (run.average_speed) {
      let type = run.type;
      let count = 1;
      let avgSpd = run.average_speed;
      let distance = run.distance;
      if(countsMap.has(type)){
        count += countsMap.get(type);
      }
      if(avgSpdMap.has(type)){
        avgSpd += avgSpdMap.get(type);
      }
      if(distanceMap.has(type)){
        distance += distanceMap.get(type);
      }
      countsMap.set(type, count)
      avgSpdMap.set(type, avgSpd)
      distanceMap.set(type, distance)
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
        { countsMap.has('Run') && (<WorkoutStat value={`${countsMap.get('Run')}`} description=" Runs" pace={formatPace(avgSpdMap.get('Run') / countsMap.get('Run'))} /* distance={(distanceMap.get('Run')/1000).toFixed(1)} *//>)}
        { countsMap.has('Ride') && (<WorkoutStat value={`${countsMap.get('Ride')}`} description=" Rides" pace={formatPace(avgSpdMap.get('Ride') / countsMap.get('Ride'))} /* distance={(distanceMap.get('Ride')/1000).toFixed(1)} *//>)}
        { countsMap.has('Hike') && (<WorkoutStat value={`${countsMap.get('Hike')}`} description=" Hikes" pace={formatPace(avgSpdMap.get('Hike') / countsMap.get('Hike'))} /* distance={(distanceMap.get('Hike')/1000).toFixed(1)} *//>)}
        { countsMap.has('Swim') && (<WorkoutStat value={`${countsMap.get('Swim')}`} description=" Swims" pace={formatPace(avgSpdMap.get('Swim') / countsMap.get('Swim'))} /* distance={(distanceMap.get('Swim')/1000).toFixed(1)} */ />)}
        { countsMap.has('Rowing') && (<WorkoutStat value={`${countsMap.get('Rowing')}`} description=" Rowings" pace={formatPace(avgSpdMap.get('Rowing') / countsMap.get('Rowing')) } /* distance={(distanceMap.get('Rowing')/1000).toFixed(1)} *//>)}
        <Stat value={sumDistance} description=" KM" />
        {/* { avgRunningPace != '0' && (<Stat value={avgRunningPace} description=" Avg Running Pace" />)}
        { avgRidingPace != '0' && (<Stat value={avgRidingPace} description=" Avg Riding Pace" />)} */}
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
