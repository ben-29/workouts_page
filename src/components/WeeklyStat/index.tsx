import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from '@/utils/utils';
import { IS_CHINESE } from '@/utils/const';

interface WeeklyStatProps {
  runs: Activity[];
}

const formatRunTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m}m`;
  return `${m}m`;
};

const WeeklyStat = ({ runs }: WeeklyStatProps) => {
  const data = useMemo(() => {
    if (!runs || runs.length === 0) return [];

    const sortedRuns = [...runs].sort(
      (a, b) =>
        new Date(a.start_date_local.replace(' ', 'T')).getTime() -
        new Date(b.start_date_local.replace(' ', 'T')).getTime()
    );

    const getWeekStart = (dateStr: string) => {
      const date = new Date(dateStr.replace(' ', 'T'));
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date.getTime());
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart.getTime();
    };

    const firstRunDateStr = sortedRuns[0].start_date_local;
    const lastRunDateStr = sortedRuns[sortedRuns.length - 1].start_date_local;

    const startWeek = getWeekStart(firstRunDateStr);
    const endWeek = getWeekStart(lastRunDateStr);

    const weeksMap = new Map();

    let currentT = new Date(startWeek);
    while (currentT.getTime() <= endWeek) {
      weeksMap.set(currentT.getTime(), {
        timestamp: currentT.getTime(),
        distance: 0,
        activities: {} as Record<
          string,
          { distance: number; time: number; elevation: number }
        >,
      });
      currentT.setDate(currentT.getDate() + 7);
    }

    sortedRuns.forEach((run) => {
      const w = getWeekStart(run.start_date_local);
      const weekData = weeksMap.get(w);
      if (weekData) {
        const runDist = run.distance / 1000;
        weekData.distance += runDist;

        const splits = run.moving_time ? run.moving_time.split(', ') : [];
        let totalSeconds = 0;
        if (splits.length > 0) {
          const timeStr = splits.splice(-1)[0];
          const days = splits.length > 1 ? parseInt(splits[0]) : 0;
          const [hours, minutes, seconds] = timeStr.split(':').map(Number);
          totalSeconds = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;
        }

        if (!weekData.activities[run.type]) {
          weekData.activities[run.type] = {
            distance: 0,
            time: 0,
            elevation: 0,
          };
        }
        weekData.activities[run.type].distance += runDist;
        weekData.activities[run.type].time += totalSeconds;
        weekData.activities[run.type].elevation += run.elevation_gain || 0;
      }
    });

    let currentYear = 0;
    let currentMonth = 0;

    const weeksList = Array.from(weeksMap.values());
    const limitedWeeksList =
      weeksList.length > 53 ? weeksList.slice(-53) : weeksList;

    return limitedWeeksList.map((item) => {
      const d = new Date(item.timestamp);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      let xLabel: string;

      if (year !== currentYear) {
        currentYear = year;
        currentMonth = month;
        xLabel = `${year}`;
      } else if (month !== currentMonth) {
        currentMonth = month;
        xLabel = IS_CHINESE
          ? `${month}月`
          : d.toLocaleString('en-US', { month: 'short' });
      } else {
        xLabel = '';
      }

      return {
        ...item,
        xLabel,
        distance: parseFloat(item.distance.toFixed(2)),
      };
    });
  }, [runs]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const d = new Date(data.timestamp);
      const endD = new Date(data.timestamp + 6 * 24 * 60 * 60 * 1000);
      const weekStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ~ ${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

      return (
        <div
          className="rounded border p-3 text-sm shadow-md"
          style={{
            backgroundColor: 'var(--color-background)',
            borderColor: 'var(--color-hr-primary)',
            color: 'var(--color-run-date)',
          }}
        >
          <p
            className="mb-2 font-bold"
            style={{ color: 'var(--color-run-table-thead)' }}
          >
            {weekStr}
          </p>
          <p className="mb-1">
            Total Distance:{' '}
            <span
              className="font-semibold"
              style={{ color: 'var(--color-run-table-thead)' }}
            >
              {data.distance.toFixed(2)} km
            </span>
          </p>
          {Object.entries(data.activities).map(
            ([type, stats]: [string, any]) => (
              <div key={type} className="mt-2 text-xs">
                <span
                  className="font-semibold"
                  style={{ color: 'var(--color-run-table-thead)' }}
                >
                  {type}
                </span>
                : {stats.distance.toFixed(2)} km | {formatRunTime(stats.time)} |{' '}
                {stats.elevation.toFixed(0)} m
              </div>
            )
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-8 mb-2 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => {
              const item = data.find((d) => d.timestamp === value);
              return item ? item.xLabel : '';
            }}
            tick={{ fontSize: 12 }}
            tickMargin={10}
            minTickGap={20}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="distance"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 1 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyStat;
