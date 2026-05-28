import * as mapboxPolyline from '@mapbox/polyline';
import gcoord from 'gcoord';
import { WebMercatorViewport } from '@math.gl/web-mercator';
import type { FeatureCollection, LineString, Feature } from 'geojson';
import type { GeoJsonProperties } from 'geojson';
import type { RPGeometry } from '@/static/run_countries';
import worldGeoJsonUrl from '@/static/world.zh.json?url';
import { getMapThemeFromCurrentTheme } from '@/hooks/useTheme';
import {
  getMapTileVendorStyles,
  MAP_TILE_STYLE_DARK,
  MAP_TILE_STYLES,
  MAP_HEIGHT,
  NEED_FIX_MAP,
} from './const';
import { Activity, colorFromType } from './utils';
import { locationForRun } from './utils';

export type Coordinate = [number, number];

export interface IViewState {
  longitude?: number;
  latitude?: number;
  zoom?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const pathForRun = (run: Activity): Coordinate[] => {
  try {
    if (!run.summary_polyline) {
      return [];
    }
    const c = mapboxPolyline.decode(run.summary_polyline);
    // reverse lat long for mapbox
    c.forEach((arr) => {
      [arr[0], arr[1]] = !NEED_FIX_MAP
        ? [arr[1], arr[0]]
        : gcoord.transform([arr[1], arr[0]], gcoord.GCJ02, gcoord.WGS84);
    });
    // try to use location city coordinate instead, if runpath is incomplete
    if (c.length === 2 && String(c[0]) === String(c[1])) {
      const { coordinate } = locationForRun(run);
      if (coordinate?.[0] && coordinate?.[1]) {
        return [coordinate, coordinate];
      }
    }
    return c;
  } catch (_err) {
    return [];
  }
};

export const geoJsonForRuns = (
  runs: Activity[]
): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: runs.map((run) => {
    const points = pathForRun(run);
    const color = colorFromType(run.type);
    return {
      type: 'Feature',
      properties: {
        color: color,
        indoor: run.subtype === 'indoor' || run.subtype === 'treadmill',
      },
      geometry: {
        type: 'LineString',
        coordinates: points,
        workoutType: run.type,
      },
      name: run.name,
    };
  }),
});

let worldGeoJsonPromise: Promise<FeatureCollection<RPGeometry>> | undefined;

const loadWorldGeoJson = () => {
  worldGeoJsonPromise ??= fetch(worldGeoJsonUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load world GeoJSON: ${response.status}`);
    }
    return response.json() as Promise<FeatureCollection<RPGeometry>>;
  });
  return worldGeoJsonPromise;
};

export const geoJsonForMap = async (): Promise<
  FeatureCollection<RPGeometry>
> => {
  const [{ chinaGeojson }, worldGeoJson] = await Promise.all([
    import('@/static/run_countries'),
    loadWorldGeoJson(),
  ]);

  return {
    type: 'FeatureCollection',
    features: [...worldGeoJson.features, ...chinaGeojson.features] as Feature<
      RPGeometry,
      GeoJsonProperties
    >[],
  };
};

export const getBoundsForGeoData = (
  geoData: FeatureCollection<LineString>
): IViewState => {
  const { features } = geoData;
  const routeBounds = features
    .map((feature) => {
      let minLon = Infinity;
      let minLat = Infinity;
      let maxLon = -Infinity;
      let maxLat = -Infinity;
      let pointCount = 0;

      for (const point of feature.geometry.coordinates as Coordinate[]) {
        const [lon, lat] = point;
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        minLon = Math.min(minLon, lon);
        minLat = Math.min(minLat, lat);
        maxLon = Math.max(maxLon, lon);
        maxLat = Math.max(maxLat, lat);
        pointCount += 1;
      }

      if (pointCount === 0) return null;
      return {
        minLon,
        minLat,
        maxLon,
        maxLat,
        centerLon: (minLon + maxLon) / 2,
        centerLat: (minLat + maxLat) / 2,
        pointCount,
      };
    })
    .filter((bounds): bounds is NonNullable<typeof bounds> => Boolean(bounds));

  if (routeBounds.length === 0) {
    return { longitude: 20, latitude: 20, zoom: 3 };
  }

  const isTotalScope = routeBounds.length > 700;
  const selectedBounds =
    routeBounds.length > 1
      ? (() => {
          const neighborCount = Math.min(
            isTotalScope
              ? 320
              : routeBounds.length > 80
                ? 80
                : Math.max(3, Math.ceil(routeBounds.length * 0.45)),
            routeBounds.length
          );
          const seed = routeBounds
            .map((candidate) => {
              const nearest = routeBounds
                .map((bounds) => {
                  const distance =
                    Math.abs(bounds.centerLon - candidate.centerLon) +
                    Math.abs(bounds.centerLat - candidate.centerLat);
                  return { bounds, distance };
                })
                .sort((a, b) => a.distance - b.distance)
                .slice(0, neighborCount);
              const score = nearest.reduce((total, { bounds, distance }) => {
                return total + bounds.pointCount / Math.max(distance, 0.002);
              }, 0);
              return { bounds: candidate, score };
            })
            .sort((a, b) => b.score - a.score)[0].bounds;

          return routeBounds
            .map((bounds) => ({
              bounds,
              distance:
                Math.abs(bounds.centerLon - seed.centerLon) +
                Math.abs(bounds.centerLat - seed.centerLat),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, neighborCount)
            .map(({ bounds }) => bounds);
        })()
      : routeBounds;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  let totalPoints = 0;

  for (const bounds of selectedBounds) {
    minLon = Math.min(minLon, bounds.minLon);
    minLat = Math.min(minLat, bounds.minLat);
    maxLon = Math.max(maxLon, bounds.maxLon);
    maxLat = Math.max(maxLat, bounds.maxLat);
    totalPoints += bounds.pointCount;
  }

  if (totalPoints <= 2 && minLon === maxLon && minLat === maxLat) {
    return { longitude: minLon, latitude: minLat, zoom: 9 };
  }

  const lonSpan = Math.max(maxLon - minLon, 0.00001);
  const latSpan = Math.max(maxLat - minLat, 0.00001);
  const lonBuffer = isTotalScope
    ? clamp(lonSpan * 0.85, 0.02, 0.16)
    : clamp(lonSpan * 0.32, 0.0025, 0.035);
  const latBuffer = isTotalScope
    ? clamp(latSpan * 0.85, 0.02, 0.16)
    : clamp(latSpan * 0.32, 0.0025, 0.035);
  minLon -= lonBuffer;
  maxLon += lonBuffer;
  minLat -= latBuffer;
  maxLat += latBuffer;

  const cornersLongLat: [Coordinate, Coordinate] = [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
  const viewportWidth =
    typeof window === 'undefined'
      ? 800
      : window.innerWidth >= 1280
        ? Math.max(window.innerWidth - 520, 760)
        : 760;
  const viewportHeight =
    typeof window === 'undefined' ? MAP_HEIGHT : MAP_HEIGHT;
  const padding =
    features.length <= 1
      ? typeof window !== 'undefined' && window.innerWidth <= 768
        ? 38
        : 46
      : typeof window !== 'undefined' && window.innerWidth <= 768
        ? 52
        : 64;
  const viewState = new WebMercatorViewport({
    width: viewportWidth,
    height: viewportHeight,
  }).fitBounds(cornersLongLat, { padding });
  let { longitude, latitude, zoom } = viewState;
  const maxZoom = features.length <= 1 ? 15.2 : isTotalScope ? 11.2 : 14.2;
  zoom = Math.max(1.5, Math.min(zoom, maxZoom));
  return { longitude, latitude, zoom };
};

export const getMapStyle = (
  vendor: string,
  styleName: string,
  token: string
) => {
  const style = getMapTileVendorStyles(vendor)?.[styleName];
  if (!style) {
    return MAP_TILE_STYLES.default;
  }
  if (vendor === 'maptiler' || vendor === 'stadiamaps') {
    return style + token;
  }
  return style;
};

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth <= 768
  );
};

export const getMapTheme = (): string => {
  if (typeof window === 'undefined') return MAP_TILE_STYLE_DARK;

  const dataTheme = document.documentElement.getAttribute('data-theme') as
    | 'light'
    | 'dark'
    | null;
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

  if (dataTheme) {
    return getMapThemeFromCurrentTheme(dataTheme);
  }
  if (savedTheme) {
    return getMapThemeFromCurrentTheme(savedTheme);
  }
  return getMapThemeFromCurrentTheme('dark');
};
