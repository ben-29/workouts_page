import Stat from '@/components/Stat';
import {
  formatPlaceDistance,
  type ScopedLocationStats,
} from '@/utils/locationStats';

const CitiesStat = ({ stats }: { stats: ScopedLocationStats }) => {
  return (
    <div>
      <section>
        {stats.topPlaces.map(({ label, distance }) => (
          <Stat
            key={label}
            value={label}
            description={` ${formatPlaceDistance(distance)}`}
            citySize={5}
          />
        ))}
      </section>
      <hr />
    </div>
  );
};

export default CitiesStat;
