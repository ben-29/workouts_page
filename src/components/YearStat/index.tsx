import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';
import { formatPace } from '@/utils/utils';

const YearStat = ({
  year,
  onClick,
}: {
  year: string;
  onClick: (_year: string) => void;
}) => {
  let { activities, years } = useActivities();

  if (years.includes(year)) {
    activities = activities.filter(
      (activity) => activity.start_date_local.slice(0, 4) === year
    );
  }

  let sumDistance = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  let totalMetersAvail = 0;
  let totalSecondsAvail = 0;
  const activeDates = new Set<string>();

  activities.forEach((activity) => {
    sumDistance += activity.distance || 0;
    activeDates.add(activity.start_date_local.slice(0, 10));
    if (activity.average_speed) {
      totalMetersAvail += activity.distance || 0;
      totalSecondsAvail += (activity.distance || 0) / activity.average_speed;
    }
    if (activity.average_heartrate) {
      heartRate += activity.average_heartrate;
    } else {
      heartRateNullCount++;
    }
  });

  sumDistance = parseFloat((sumDistance / 1000.0).toFixed(1));
  const avgPace = formatPace(totalMetersAvail / totalSecondsAvail);
  const hasHeartRate = heartRate > 0;
  const avgHeartRate = (
    heartRate /
    (activities.length - heartRateNullCount)
  ).toFixed(0);

  return (
    <div className="cursor-pointer" onClick={() => onClick(year)}>
      <section>
        <Stat value={year} description=" Journey" />
        <Stat value={activities.length} description=" Activities" />
        <Stat value={sumDistance} description=" KM" />
        {avgPace && <Stat value={avgPace} description=" Avg Pace" />}
        <Stat value={activeDates.size} description=" Active Days" />
        {hasHeartRate && (
          <Stat value={avgHeartRate} description=" Avg Heart Rate" />
        )}
      </section>
      <hr />
    </div>
  );
};

export default YearStat;
