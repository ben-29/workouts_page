import { COUNTRY_STANDARDIZATION } from '@/static/city';
import type { Activity } from './utils';
import { DIST_UNIT, M_TO_DIST, locationForRun } from './utils';

export interface ScopedLocationStats {
  cities: Record<string, number>;
  countries: string[];
  provinces: string[];
  topPlaces: Array<{ distance: number; label: string }>;
  yearCount: number;
}

const standardizeCountryName = (country: string): string => {
  for (const [pattern, standardName] of COUNTRY_STANDARDIZATION) {
    if (country.includes(pattern)) {
      return standardName;
    }
  }
  return country;
};

export const getScopedLocationStats = (
  runs: Activity[]
): ScopedLocationStats => {
  const countries = new Set<string>();
  const provinces = new Set<string>();
  const years = new Set<string>();
  const cities: Record<string, number> = {};

  runs.forEach((run) => {
    if (run.start_date_local) {
      years.add(run.start_date_local.slice(0, 4));
    }

    const { city, province, country } = locationForRun(run);
    if (city.length > 1) {
      cities[city] = (cities[city] ?? 0) + (run.distance ?? 0);
    }
    if (province) provinces.add(province);
    if (country) countries.add(standardizeCountryName(country));
  });

  const topPlaces = Object.entries(cities)
    .map(([label, distance]) => ({ label, distance }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 8);

  return {
    cities,
    countries: [...countries],
    provinces: [...provinces],
    topPlaces,
    yearCount: years.size,
  };
};

export const formatPlaceDistance = (meters: number) =>
  `${(meters / M_TO_DIST).toFixed(0)} ${DIST_UNIT}`;

export const getRouteScopedLocationStats = async (
  runs: Activity[]
): Promise<ScopedLocationStats> => {
  return getScopedLocationStats(runs);
};
