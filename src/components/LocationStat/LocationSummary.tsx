import Stat from '@/components/Stat';
import type { ScopedLocationStats } from '@/utils/locationStats';

const LocationSummary = ({ stats }: { stats: ScopedLocationStats }) => {
  const { yearCount, countries, provinces, cities } = stats;
  return (
    <div>
      <section>
        {yearCount ? (
          <Stat value={`${yearCount}`} description=" years of activity" />
        ) : null}
        {countries ? (
          <Stat value={countries.length} description=" countries" />
        ) : null}
        {provinces ? (
          <Stat value={provinces.length} description=" provinces" />
        ) : null}
        {cities ? (
          <Stat value={Object.keys(cities).length} description=" cities" />
        ) : null}
      </section>
    </div>
  );
};

export default LocationSummary;
