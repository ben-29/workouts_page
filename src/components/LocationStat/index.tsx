import type { ScopedLocationStats } from '@/utils/locationStats';
import CitiesStat from './CitiesStat';
import LocationSummary from './LocationSummary';

interface ILocationStatProps {
  changeCity: (_city: string) => void;
  stats: ScopedLocationStats;
}

const LocationStat = ({
  changeCity,
  stats,
}: ILocationStatProps) => (
  <div className="w-full pb-16 lg:w-full lg:pr-16">
    <LocationSummary stats={stats} />
    <CitiesStat onClick={changeCity} stats={stats} />
  </div>
);

export default LocationStat;
