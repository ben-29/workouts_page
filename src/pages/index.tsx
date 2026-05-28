import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Helmet } from 'react-helmet-async';
import ContributionHeatmap from '@/components/ContributionHeatmap';
import Layout from '@/components/Layout';
import LongRouteGrid from '@/components/LongRouteGrid';
import LocationStat from '@/components/LocationStat';
import RunMap from '@/components/RunMap';
import RunTable from '@/components/RunTable';
import YearsStat from '@/components/YearsStat';
import useActivities from '@/hooks/useActivities';
import getSiteMetadata from '@/hooks/useSiteMetadata';
import { useInterval } from '@/hooks/useInterval';
import {
  Activity,
  filterAndSortRuns,
  filterTypeRuns,
  filterYearRuns,
  sortDateFunc,
  scrollToMap,
  titleForShow,
  RunIds,
} from '@/utils/utils';
import {
  geoJsonForRuns,
  getBoundsForGeoData,
  type IViewState,
} from '@/utils/geoUtils';
import {
  getRouteScopedLocationStats,
  getScopedLocationStats,
} from '@/utils/locationStats';
import { useTheme, useThemeChangeCounter } from '@/hooks/useTheme';

const HASH_RUN_CHANGE_EVENT = 'running-page-hash-run-change';

const getRunIdFromHash = () => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace('#', '');
  if (!hash.startsWith('run_')) return null;
  const runId = parseInt(hash.replace('run_', ''), 10);
  return Number.isNaN(runId) ? null : runId;
};

const subscribeToRunHash = (onStoreChange: () => void) => {
  window.addEventListener('hashchange', onStoreChange);
  window.addEventListener(HASH_RUN_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('hashchange', onStoreChange);
    window.removeEventListener(HASH_RUN_CHANGE_EVENT, onStoreChange);
  };
};

const notifyRunHashChange = () => {
  window.dispatchEvent(new Event(HASH_RUN_CHANGE_EVENT));
};

const clearRunHash = () => {
  if (window.location.hash) {
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`
    );
    notifyRunHashChange();
  }
};

const setRunHash = (runId: number) => {
  const newHash = `#run_${runId}`;
  if (window.location.hash !== newHash) {
    window.history.pushState(null, '', newHash);
    notifyRunHashChange();
  }
};

const useRunHashId = () =>
  useSyncExternalStore(subscribeToRunHash, getRunIdFromHash, () => null);

const Index = () => {
  const { siteTitle } = getSiteMetadata();
  const { activities, thisYear } = useActivities();
  const themeChangeCounter = useThemeChangeCounter();
  const [year, setYear] = useState('Total');
  const [runIndex, setRunIndex] = useState(-1);
  const [title, setTitle] = useState('');
  // Animation states for replacing intervalIdRef
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [animationRuns, setAnimationRuns] = useState<Activity[]>([]);
  const [currentFilter, setCurrentFilter] = useState<{
    item: string;
    func: (_run: Activity, _value: string) => boolean;
    item2: string | null;
    func2: ((_run: Activity, _value: string) => boolean) | null;
  }>({ item: 'Total', func: filterYearRuns, item2: null, func2: null });

  // Track if we're showing a single run from URL hash
  const singleRunId = useRunHashId();

  // Animation trigger for single runs - increment this to force animation replay
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Memoize expensive calculations
  const runs = useMemo(() => {
    return filterAndSortRuns(
      activities,
      currentFilter.item,
      currentFilter.func,
      sortDateFunc,
      currentFilter.item2,
      currentFilter.func2
    );
  }, [
    activities,
    currentFilter.item,
    currentFilter.func,
    currentFilter.item2,
    currentFilter.func2,
  ]);

  const geoData = useMemo(() => {
    void themeChangeCounter;
    return geoJsonForRuns(runs);
  }, [runs, themeChangeCounter]);

  const scopedLocationStats = useMemo(
    () => getScopedLocationStats(runs),
    [runs]
  );
  const [routeScopedLocationStats, setRouteScopedLocationStats] =
    useState(scopedLocationStats);

  useEffect(() => {
    let canceled = false;
    getRouteScopedLocationStats(runs)
      .then((stats) => {
        if (!canceled) setRouteScopedLocationStats(stats);
      })
      .catch(() => {
        if (!canceled) setRouteScopedLocationStats(scopedLocationStats);
      });
    return () => {
      canceled = true;
    };
  }, [runs, scopedLocationStats]);

  // for auto zoom
  const bounds = useMemo(() => {
    return getBoundsForGeoData(geoData);
  }, [geoData]);

  const [viewState, setViewState] = useState<IViewState>(() => ({
    ...bounds,
  }));

  // Add state for animated geoData to handle the animation effect
  const [animatedGeoData, setAnimatedGeoData] = useState(geoData);

  // Use useInterval for animation instead of intervalIdRef
  useInterval(
    () => {
      if (!isAnimating || currentAnimationIndex >= animationRuns.length) {
        setIsAnimating(false);
        setAnimatedGeoData(geoData);
        return;
      }

      const runsNum = animationRuns.length;
      const sliceNum = runsNum >= 8 ? Math.ceil(runsNum / 8) : 1;
      const nextIndex = Math.min(currentAnimationIndex + sliceNum, runsNum);
      const tempRuns = animationRuns.slice(0, nextIndex);
      setAnimatedGeoData(geoJsonForRuns(tempRuns));
      setCurrentAnimationIndex(nextIndex);

      if (nextIndex >= runsNum) {
        setIsAnimating(false);
        setAnimatedGeoData(geoData);
      }
    },
    isAnimating ? 300 : null
  );

  // Helper function to start animation
  const startAnimation = useCallback(
    (runsToAnimate: Activity[]) => {
      if (runsToAnimate.length === 0) {
        setAnimatedGeoData(geoData);
        return;
      }

      const sliceNum =
        runsToAnimate.length >= 8 ? Math.ceil(runsToAnimate.length / 8) : 1;
      setAnimationRuns(runsToAnimate);
      setCurrentAnimationIndex(sliceNum);
      setIsAnimating(true);
    },
    [geoData]
  );

  const changeByItem = useCallback(
    (
      item: string,
      name: string,
      func: (_run: Activity, _value: string) => boolean
    ) => {
      if (name != 'Year') {
        setYear(thisYear);
      }
      setCurrentFilter({ item, func });
      setRunIndex(-1);
      setTitle(`${item} ${name} Heatmap`);
      // Reset single run state when changing filters
      clearRunHash();
    },
    [thisYear]
  );

  const changeTypeInYear = useCallback(
    (year: string, type: string) => {
      // type in year, filter year first, then type
      if (year != 'Total') {
        setYear(year);
        setCurrentFilter({
          item: year,
          func: filterYearRuns,
          item2: type,
          func2: filterTypeRuns,
        });
      } else {
        setYear(thisYear);
        setCurrentFilter({ item: type, func: filterTypeRuns });
      }
      setRunIndex(-1);
      setTitle(`${year} ${type} Type Heatmap`);
      // Reset single run state when changing filters
      clearRunHash();
    },
    [thisYear]
  );

  const changeYear = useCallback(
    (y: string) => {
      // default year
      setYear(y);

      if ((viewState.zoom ?? 0) > 3 && bounds) {
        setViewState({
          ...bounds,
        });
      }

      changeByItem(y, 'Year', filterYearRuns);
      // Stop current animation
      setIsAnimating(false);
    },
    [viewState.zoom, bounds, changeByItem]
  );

  const locateActivity = useCallback(
    (runIds: RunIds) => {
      const ids = new Set(runIds);

      const selectedRuns = !runIds.length
        ? runs
        : runs.filter((run: Activity) => ids.has(run.run_id));

      if (!selectedRuns.length) {
        return;
      }

      const lastRun = selectedRuns.slice().sort(sortDateFunc)[0];

      if (!lastRun) {
        return;
      }

      // Set runIndex for table highlighting when single run is selected
      if (runIds.length === 1) {
        const runId = runIds[0];
        const runIdx = runs.findIndex((run) => run.run_id === runId);
        setRunIndex(runIdx);
      } else {
        setRunIndex(-1);
      }

      // Update URL hash when a single run is located
      if (runIds.length === 1) {
        const runId = runIds[0];
        setRunHash(runId);
      } else {
        // If multiple runs or no runs, clear the hash and single run state
        clearRunHash();
      }

      // Create geoData for selected runs and calculate new bounds
      const selectedGeoData = geoJsonForRuns(selectedRuns);
      const selectedBounds = getBoundsForGeoData(selectedGeoData);

      // Stop any existing animation
      setIsAnimating(false);

      // Update the animated geoData immediately to trigger RunMap animation
      setAnimatedGeoData(selectedGeoData);

      // For single run, trigger animation by incrementing the trigger
      if (runIds.length === 1) {
        setAnimationTrigger((prev) => prev + 1);
      }

      // Update view state
      setViewState({
        ...selectedBounds,
      });
      if (runIds.length === 1) {
        requestAnimationFrame(scrollToMap);
      }
      setTitle(titleForShow(lastRun));
    },
    [runs]
  );

  // Auto locate activity when singleRunId is set and activities are loaded
  // First, detect the run's year and switch to it if needed
  useEffect(() => {
    if (singleRunId !== null && activities.length > 0) {
      const frameId = requestAnimationFrame(() => {
        const targetRun = activities.find((run) => run.run_id === singleRunId);
        if (targetRun) {
          const runYear = targetRun.start_date_local.slice(0, 4);
          if (year !== runYear) {
            setYear(runYear);
            setCurrentFilter({ item: runYear, func: filterYearRuns });
          }
        } else {
          // If run doesn't exist, clear the hash and show a warning
          console.warn(`Run with ID ${singleRunId} not found in activities`);
          window.history.replaceState(null, '', window.location.pathname);
          notifyRunHashChange();
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [singleRunId, activities, year]);

  useEffect(() => {
    if (singleRunId !== null && runs.length > 0) {
      const frameId = requestAnimationFrame(() => {
        const runExistsInCurrentRuns = runs.some(
          (run) => run.run_id === singleRunId
        );
        if (runExistsInCurrentRuns) {
          locateActivity([singleRunId]);
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [runs, singleRunId, locateActivity]);

  // Update bounds when geoData changes
  useEffect(() => {
    if (singleRunId === null) {
      const frameId = requestAnimationFrame(() => {
        setViewState((prev) => ({
          ...prev,
          ...bounds,
        }));
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [bounds, singleRunId]);

  // Animate geoData when runs change
  useEffect(() => {
    if (singleRunId === null) {
      const frameId = requestAnimationFrame(() => startAnimation(runs));
      return () => cancelAnimationFrame(frameId);
    }
  }, [runs, startAnimation, singleRunId]);

  const { theme } = useTheme();

  return (
    <Layout>
      <Helmet>
        <html lang="en" data-theme={theme} />
      </Helmet>
      <div className="w-[390px] shrink-0 pr-2">
        <a
          className="mt-0 mb-6 block text-5xl leading-none font-extrabold text-neutral-950 italic no-underline"
          href="/"
        >
          {siteTitle}
        </a>
        <hr className="my-6 border-t-2 border-neutral-300" />
        {(viewState.zoom ?? 0) <= 3 ? (
          <LocationStat stats={routeScopedLocationStats} />
        ) : (
          <YearsStat
            year={year}
            onClick={changeYear}
            onClickTypeInYear={changeTypeInYear}
          />
        )}
      </div>
      <div
        className="min-w-0 flex-1 border-l border-neutral-300 pl-8"
        id="map-container"
      >
        <div className="mx-auto w-full max-w-[840px]">
          <section>
            <RunMap
              title={title}
              viewState={viewState}
              geoData={animatedGeoData}
              setViewState={setViewState}
              changeYear={changeYear}
              thisYear={year}
              animationTrigger={animationTrigger}
            />
          </section>
          {year === 'Total' ? (
            <>
              <section className="mt-5 border-t border-neutral-300 pt-5">
                <LongRouteGrid runs={runs} locateActivity={locateActivity} />
              </section>
              <section className="mt-5 border-t border-neutral-300 pt-5">
                <ContributionHeatmap activities={activities} />
              </section>
            </>
          ) : (
            <section className="mt-5 border-t border-neutral-300 pt-5">
              <RunTable
                runs={runs}
                locateActivity={locateActivity}
                runIndex={runIndex}
                setRunIndex={setRunIndex}
              />
            </section>
          )}
        </div>
      </div>
      {/* Enable Audiences in Vercel Analytics: https://vercel.com/docs/concepts/analytics/audiences/quickstart */}
      {import.meta.env.VERCEL && <Analytics />}
    </Layout>
  );
};

export default Index;
