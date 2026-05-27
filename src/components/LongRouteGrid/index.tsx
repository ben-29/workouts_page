import { useMemo } from 'react';
import { pathForRun } from '@/utils/geoUtils';
import type { Activity, RunIds } from '@/utils/utils';

interface LongRouteGridProps {
  runs: Activity[];
  locateActivity: (_runIds: RunIds) => void;
}

const M_TO_KM = 1000;
const HALF_MARATHON_KM = 21.0975;
const FULL_MARATHON_KM = 42.195;
const OVER_10_COLOR = '#4DD2FF';
const OVER_HALF_COLOR = '#F7D02C';
const OVER_FULL_COLOR = '#F56C6C';

const colorForDistance = (distanceKm: number) => {
  if (distanceKm >= FULL_MARATHON_KM) return OVER_FULL_COLOR;
  if (distanceKm >= HALF_MARATHON_KM) return OVER_HALF_COLOR;
  return OVER_10_COLOR;
};

const routePath = (run: Activity) => {
  const points = pathForRun(run);
  if (points.length < 2) return '';

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  points.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  });

  const width = Math.max(maxLon - minLon, 0.00001);
  const height = Math.max(maxLat - minLat, 0.00001);
  const scale = Math.min(52 / width, 36 / height);
  const routeWidth = width * scale;
  const routeHeight = height * scale;
  const xOffset = (64 - routeWidth) / 2;
  const yOffset = (48 - routeHeight) / 2;

  return points
    .map(([lon, lat], index) => {
      const x = xOffset + (lon - minLon) * scale;
      const y = yOffset + (maxLat - lat) * scale;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};

const LongRouteGrid = ({ runs, locateActivity }: LongRouteGridProps) => {
  const longRuns = useMemo(
    () =>
      runs
        .filter((run) => run.distance / M_TO_KM >= 10 && run.summary_polyline)
        .slice()
        .sort((a, b) => b.start_date_local.localeCompare(a.start_date_local)),
    [runs]
  );

  if (!longRuns.length) {
    return null;
  }

  return (
    <section className="mt-4 w-full bg-transparent">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
      >
        {longRuns.map((run) => {
          const distanceKm = run.distance / M_TO_KM;
          const path = routePath(run);
          if (!path) return null;
          return (
            <button
              aria-label={`${run.name} ${distanceKm.toFixed(1)} KM`}
              className="h-12 w-full cursor-pointer border-0 bg-transparent p-0 hover:bg-neutral-100"
              key={run.run_id}
              onClick={() => locateActivity([run.run_id])}
              title={`${run.name} ${distanceKm.toFixed(1)} KM`}
              type="button"
            >
              <svg
                className="h-full w-full"
                role="img"
                viewBox="0 0 64 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={path}
                  fill="none"
                  stroke={colorForDistance(distanceKm)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
              </svg>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 bg-[#4DD2FF]" />
          Over 10.0 KM
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 bg-[#F7D02C]" />
          Over {HALF_MARATHON_KM.toFixed(1)} KM
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 bg-[#F56C6C]" />
          Over {FULL_MARATHON_KM.toFixed(1)} KM
        </span>
      </div>
    </section>
  );
};

export default LongRouteGrid;
