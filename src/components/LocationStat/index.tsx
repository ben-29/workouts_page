import type { ScopedLocationStats } from '@/utils/locationStats';
import LocationSummary from './LocationSummary';

interface ILocationStatProps {
  stats: ScopedLocationStats;
}

const LocationStat = ({ stats }: ILocationStatProps) => (
  <div className="w-full pb-16 lg:w-full lg:pr-16">
    <LocationSummary stats={stats} />
  </div>
);

export default LocationStat;
