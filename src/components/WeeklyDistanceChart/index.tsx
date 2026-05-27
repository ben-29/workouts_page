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

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatWeekLabel = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const WeeklyDistanceChart = ({ runs }: WeeklyDistanceChartProps) => {
  const data = useMemo(() => {
    const byWeek = new Map<string, { date: Date; distance: number }>();
    runs.forEach((run) => {
      const dateText = run.start_date_local?.slice(0, 10);
      if (!dateText) return;
      const date = new Date(`${dateText}T00:00:00`);
      const weekStart = startOfWeek(date);
      const key = dateKey(weekStart);
      const current = byWeek.get(key) ?? { date: weekStart, distance: 0 };
      current.distance += run.distance ?? 0;
      byWeek.set(key, current);
    });

    return Array.from(byWeek, ([week, value]) => ({
      week,
      label: formatWeekLabel(value.date),
      distance: Number((value.distance / M_TO_DIST).toFixed(2)),
    })).sort((a, b) => a.week.localeCompare(b.week));
  }, [runs]);

  if (data.length < 2) {
    return null;
  }

  return (
    <div className="mt-4 h-[150px] w-full bg-[var(--color-background)]">
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 10, right: 18, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke="#d4d4d4" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            minTickGap={42}
            tick={{ fill: '#525252', fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#525252', fontSize: 10 }}
            tickLine={false}
            width={44}
            label={{
              value: DIST_UNIT,
              angle: -90,
              position: 'insideLeft',
              offset: 4,
              fill: '#525252',
              fontSize: 10,
            }}
          />
          <Tooltip
            formatter={(value) => [`${value} ${DIST_UNIT}`, 'Weekly distance']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.week ?? ''}
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
            dot={{ r: 2, fill: '#111111', strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#111111', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyDistanceChart;
