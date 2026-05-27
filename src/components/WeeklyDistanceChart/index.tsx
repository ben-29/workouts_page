import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Activity } from '@/utils/utils';
import { DIST_UNIT, M_TO_DIST } from '@/utils/utils';

interface WeeklyDistanceChartProps {
  runs: Activity[];
}

interface ChartPoint {
  week: string;
  tick: string;
  distance: number;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const dayMs = 24 * 60 * 60 * 1000;

const parseLocalDate = (dateText: string) => new Date(`${dateText}T00:00:00`);

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfWeek = (date: Date) => {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return next;
};

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * dayMs);

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const monthLabelForWeek = (date: Date, previousDate?: Date) => {
  if (!previousDate) {
    return MONTHS[date.getMonth()];
  }
  const currentMonth = date.getMonth();
  const previousMonth = previousDate.getMonth();
  const weekEnd = endOfWeek(date);
  if (currentMonth !== previousMonth) {
    return MONTHS[currentMonth];
  }
  if (date.getDate() <= 7 || weekEnd.getMonth() !== currentMonth) {
    return MONTHS[weekEnd.getMonth()];
  }
  return '';
};

const scopeDatesForRuns = (runs: Activity[]) => {
  const dates = runs
    .map((run) => run.start_date_local?.slice(0, 10))
    .filter((dateText): dateText is string => Boolean(dateText))
    .map(parseLocalDate)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) return null;

  const years = new Set(dates.map((date) => date.getFullYear()));
  if (years.size === 1) {
    const year = dates[0].getFullYear();
    return {
      start: startOfWeek(new Date(year, 0, 1)),
      end: startOfWeek(new Date(year, 11, 31)),
    };
  }

  return {
    start: startOfWeek(dates[0]),
    end: startOfWeek(dates[dates.length - 1]),
  };
};

const WeeklyDistanceChart = ({ runs }: WeeklyDistanceChartProps) => {
  const { data, ticks } = useMemo(() => {
    const scope = scopeDatesForRuns(runs);
    if (!scope) return { data: [] as ChartPoint[], ticks: [] as string[] };

    const byWeek = new Map<string, number>();
    runs.forEach((run) => {
      const dateText = run.start_date_local?.slice(0, 10);
      if (!dateText) return;
      const weekStart = startOfWeek(parseLocalDate(dateText));
      const key = dateKey(weekStart);
      byWeek.set(key, (byWeek.get(key) ?? 0) + (run.distance ?? 0));
    });

    const points: ChartPoint[] = [];
    const monthTicks: string[] = [];
    let previousWeek: Date | undefined;

    for (
      let cursor = new Date(scope.start);
      cursor.getTime() <= scope.end.getTime();
      cursor = addDays(cursor, 7)
    ) {
      const key = dateKey(cursor);
      const tick = monthLabelForWeek(cursor, previousWeek);
      if (tick) monthTicks.push(key);
      points.push({
        week: key,
        tick,
        distance: Number(((byWeek.get(key) ?? 0) / M_TO_DIST).toFixed(2)),
      });
      previousWeek = new Date(cursor);
    }

    return { data: points, ticks: monthTicks };
  }, [runs]);

  if (!data.length) {
    return null;
  }

  return (
    <div className="h-[170px] w-full bg-[var(--color-background)]">
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 12, right: 18, left: 16, bottom: 8 }}
        >
          <CartesianGrid stroke="#d4d4d4" strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            interval={0}
            minTickGap={18}
            ticks={ticks}
            tick={{ fill: '#525252', fontSize: 11 }}
            tickFormatter={(value) =>
              data.find((point) => point.week === value)?.tick ?? ''
            }
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#525252', fontSize: 11 }}
            tickLine={false}
            width={46}
          />
          <Tooltip
            formatter={(value) => [`${value} ${DIST_UNIT}`, 'Weekly distance']}
            labelFormatter={(value) => `Week of ${value}`}
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #d4d4d4',
              color: '#111111',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey="distance"
            stroke="#111111"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#111111', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyDistanceChart;
