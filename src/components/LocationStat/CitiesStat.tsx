import Stat from '@/components/Stat';
import {
  formatPlaceDistance,
  type ScopedLocationStats,
} from '@/utils/locationStats';

const CitiesStat = ({
  onClick,
  stats,
}: {
  onClick: (_city: string) => void;
  stats: ScopedLocationStats;
}) => {
  return (
    <div className="cursor-pointer">
      <section>
        {stats.topPlaces.map(({ label, distance }) => (
          <Stat
            key={label}
            value={label}
            description={` ${formatPlaceDistance(distance)}`}
            citySize={5}
            onClick={() => onClick(label)}
          />
        ))}
      </section>
      <hr />
    </div>
  );
};

export default CitiesStat;
