import { Analytics } from '@vercel/analytics/react';
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import LocationStat from '@/components/LocationStat';
import RunMap from '@/components/RunMap';
import RunTable from '@/components/RunTable';
import SVGStat from '@/components/SVGStat';
import YearsStat from '@/components/YearsStat';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import { IS_CHINESE } from '@/utils/const';
import {
  Activity,
  IViewport,
  filterAndSortRuns,
  filterCityRuns,
  filterTitleRuns,
  filterTypeRuns,
  filterYearRuns,
  geoJsonForRuns,
  getBoundsForGeoData,
  scrollToMap,
  sortDateFunc,
  titleForShow,
} from '@/utils/utils';

const Index = () => {
  const { siteTitle } = useSiteMetadata();
  const { activities, thisYear } = useActivities();
  const [year, setYear] = useState('Total');
  const [runIndex, setRunIndex] = useState(-1);
  const [runs, setActivity] = useState(
    filterAndSortRuns(activities, year, filterYearRuns, sortDateFunc)
  );
  const [title, setTitle] = useState('');
  const [geoData, setGeoData] = useState(geoJsonForRuns(runs));
  // for auto zoom
  const bounds = getBoundsForGeoData(geoData);
  const [intervalId, setIntervalId] = useState<number>();

  const [viewport, setViewport] = useState<IViewport>({
    ...bounds,
  });

  const changeByItem = (
    item: string,
    name: string,
    func: (_run: Activity, _value: string) => boolean
  ) => {
    scrollToMap();
    setActivity(filterAndSortRuns(activities, item, func, sortDateFunc));
    setRunIndex(-1);
    setTitle(`${item} ${name} Heatmap`);
  };

  const changeYear = (y: string) => {
    // default year
    setYear(y);

    if ((viewport.zoom ?? 0) > 3) {
      setViewport({
        ...bounds,
      });
    }

    changeByItem(y, 'Year', filterYearRuns);
    clearInterval(intervalId);
  };

  const changeCity = (city: string) => {
    changeByItem(city, 'City', filterCityRuns);
  };

  const changeTitle = (title: string) => {
    changeByItem(title, 'Title', filterTitleRuns);
  };

  const changeType = (type: string) => {
    changeByItem(type, 'Type', filterTypeRuns, false);
  };

  const locateActivity = (runIds: number[]) => {
    const ids = new Set(runIds)

    const selectedRuns = runs.filter((r) => ids.has(r.run_id));

    if (!selectedRuns.length) {
      return;
    }

    const lastRun = selectedRuns.sort(sortDateFunc)[0];

    if (!lastRun) {
      return;
    }
    setGeoData(geoJsonForRuns(selectedRuns));
    setTitle(titleForShow(lastRun));
    clearInterval(intervalId);
    scrollToMap();
  };

  useEffect(() => {
    setViewport({
      ...bounds,
    });
  }, [geoData]);

  useEffect(() => {
    const runsNum = runs.length;
    // maybe change 20 ?
    const sliceNume = runsNum >= 20 ? runsNum / 20 : 1;
    let i = sliceNume;
    const id = setInterval(() => {
      if (i >= runsNum) {
        clearInterval(id);
      }

      const tempRuns = runs.slice(0, i);
      setGeoData(geoJsonForRuns(tempRuns));
      i += sliceNume;
    }, 100);
    setIntervalId(id);
  }, [runs]);

  useEffect(() => {
    if (year !== 'Total') {
      return;
    }

    let svgStat = document.getElementById('svgStat');
    if (!svgStat) {
      return;
    }
    svgStat.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target) {
        const tagName = target.tagName.toLowerCase();

        // 点击的是 github 样式 svg
        if (tagName === 'rect' &&
          parseFloat(target.getAttribute('width')) === 2.6 &&
          parseFloat(target.getAttribute('height')) === 2.6 &&
          target.getAttribute('fill') !== '#444444') {

          const [runDate] = target.innerHTML.match(/\d{4}-\d{1,2}-\d{1,2}/) || [`${+thisYear + 1}`];
          const runIDsOnDate = runs.filter((r) => r.start_date_local.slice(0, 10) === runDate).map((r) => r.run_id)
          if (!runIDsOnDate.length) {
            return;
          }
          locateActivity(runIDsOnDate);

        } else if (tagName === 'polyline') { // 点击的是路线缩略图
          const desc = target.getElementsByTagName('desc')[0];
          if (!desc) { return }
          const run_id = Number(desc.innerHTML);
          if (!run_id) {
            return;
          }
          locateActivity([run_id]);
        }
      }
    });
  }, [year]);

  return (
    <Layout>
      <div className="fl w-30-l">
        <h1 className="f1 fw9 i">
          <a href="/">{siteTitle}</a>
        </h1>
        {(viewport.zoom ?? 0) <= 3 && IS_CHINESE ? (
          <LocationStat
            changeYear={changeYear}
            changeCity={changeCity}
            changeType={changeType}
          />
        ) : (
          <YearsStat year={year} onClick={changeYear} />
        )}
      </div>
      <div className="fl w-100 w-70-l">
        <RunMap
          title={title}
          viewport={viewport}
          geoData={geoData}
          setViewport={setViewport}
          changeYear={changeYear}
          thisYear={year}
        />
        {year === 'Total' ? (
          <SVGStat />
        ) : (
          <RunTable
            runs={runs}
            locateActivity={locateActivity}
            setActivity={setActivity}
            runIndex={runIndex}
            setRunIndex={setRunIndex}
          />
        )}
      </div>
      {/* Enable Audiences in Vercel Analytics: https://vercel.com/docs/concepts/analytics/audiences/quickstart */}
      <Analytics />
    </Layout>
  );
};

export default Index;