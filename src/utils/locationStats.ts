import { COUNTRY_STANDARDIZATION } from '@/static/city';
import type { Activity } from './utils';
import { DIST_UNIT, M_TO_DIST, locationForRun } from './utils';
import {
  geoJsonForMap,
  pathForRun,
  type Coordinate,
} from './geoUtils';
import type { Feature } from 'geojson';
import type { RPGeometry } from '@/static/run_countries';

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

const pointInRing = (point: Coordinate, ring: Coordinate[]) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
};

const pointInPolygon = (point: Coordinate, polygon: Coordinate[][]) =>
  polygon.length > 0 &&
  pointInRing(point, polygon[0]) &&
  !polygon.slice(1).some((ring) => pointInRing(point, ring));

const featureContainsPoint = (
  feature: Feature<RPGeometry>,
  point: Coordinate
) => {
  const { geometry } = feature;
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates as Coordinate[][]);
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as Coordinate[][][]).some((polygon) =>
      pointInPolygon(point, polygon)
    );
  }
  return false;
};

const sampleRoutePoints = (points: Coordinate[]) => {
  if (points.length <= 12) return points;
  const step = Math.max(1, Math.floor(points.length / 12));
  const sampled = points.filter((_, index) => index % step === 0);
  sampled.push(points[points.length - 1]);
  return sampled;
};

const featureName = (feature: Feature<RPGeometry>) =>
  String(feature.properties?.name ?? '');

export const getRouteScopedLocationStats = async (
  runs: Activity[]
): Promise<ScopedLocationStats> => {
  const baseStats = getScopedLocationStats(runs);
  const mapData = await geoJsonForMap();
  const countries = new Set(baseStats.countries);
  const provinces = new Set(baseStats.provinces);
  const placeDistances: Record<string, number> = { ...baseStats.cities };
  const countryFeatures = mapData.features.filter(
    (feature) => feature.properties?.iso_a2
  ) as Feature<RPGeometry>[];
  const provinceFeatures = mapData.features.filter(
    (feature) => !feature.properties?.iso_a2
  ) as Feature<RPGeometry>[];

  runs.forEach((run) => {
    const points = sampleRoutePoints(pathForRun(run));
    if (!points.length) return;

    const matchedProvinces = new Set<string>();
    const matchedCountries = new Set<string>();

    points.forEach((point) => {
      provinceFeatures.forEach((feature) => {
        const name = featureName(feature);
        if (name && !matchedProvinces.has(name) && featureContainsPoint(feature, point)) {
          matchedProvinces.add(name);
        }
      });
      countryFeatures.forEach((feature) => {
        const name = featureName(feature);
        if (name && !matchedCountries.has(name) && featureContainsPoint(feature, point)) {
          matchedCountries.add(standardizeCountryName(name));
        }
      });
    });

    matchedProvinces.forEach((name) => provinces.add(name));
    matchedCountries.forEach((name) => countries.add(name));

    const primaryPlace =
      [...matchedProvinces][0] ?? [...matchedCountries][0] ?? null;
    if (primaryPlace) {
      placeDistances[primaryPlace] =
        (placeDistances[primaryPlace] ?? 0) + (run.distance ?? 0);
    }
  });

  return {
    ...baseStats,
    cities: placeDistances,
    countries: [...countries],
    provinces: [...provinces],
    topPlaces: Object.entries(placeDistances)
      .map(([label, distance]) => ({ label, distance }))
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 8),
  };
};
