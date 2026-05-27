import Stat from '@/components/Stat';
import type { ScopedLocationStats } from '@/utils/locationStats';

const plural = (
  count: number,
  singular: string,
  pluralText = `${singular}s`
) => (count === 1 ? singular : pluralText);

const LocationSummary = ({ stats }: { stats: ScopedLocationStats }) => {
  const { yearCount, countries, provinces, cities } = stats;
  const countryCount = countries.length;
  const provinceCount = provinces.length;
  const cityCount = Object.keys(cities).length;

  return (
    <div>
      <section>
        {yearCount ? (
          <Stat
            value={`${yearCount}`}
            description={` ${plural(yearCount, 'year')} of activity`}
          />
        ) : null}
        {countryCount ? (
          <Stat
            value={countryCount}
            description={` ${plural(countryCount, 'country', 'countries')}`}
          />
        ) : null}
        {provinceCount ? (
          <Stat
            value={provinceCount}
            description={` ${plural(provinceCount, 'province')}`}
          />
        ) : null}
        {cityCount ? (
          <Stat
            value={cityCount}
            description={` ${plural(cityCount, 'city', 'cities')}`}
          />
        ) : null}
      </section>
    </div>
  );
};

export default LocationSummary;
