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

interface DailyDistanceChartProps {
  runs: Activity[];
}

const formatDateLabel = (date: string) => {
  const [, month, day] = date.split('-');
  return `${month}/${day}`;
};

const DailyDistanceChart = ({ runs }: DailyDistanceChartProps) => {
  const data = useMemo(() => {
    const byDate = new Map<string, number>();
    runs.forEach((run) => {
      const date = run.start_date_local?.slice(0, 10);
      if (!date) return;
      byDate.set(date, (byDate.get(date) ?? 0) + (run.distance ?? 0));
    });

    return Array.from(byDate, ([date, distance]) => ({
      date,
      label: formatDateLabel(date),
      distance: Number((distance / M_TO_DIST).toFixed(2)),
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [runs]);

  if (data.length < 2) {
    return null;
  }

  return (
    <div className="mt-4 h-[150px] w-full bg-[var(--color-background)]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#d4d4d4" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            minTickGap={34}
            tick={{ fill: '#525252', fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#525252', fontSize: 10 }}
            tickLine={false}
            width={42}
            label={{
              value: DIST_UNIT,
              angle: -90,
              position: 'insideLeft',
              fill: '#525252',
              fontSize: 10,
            }}
          />
          <Tooltip
            formatter={(value) => [`${value} ${DIST_UNIT}`, 'Distance']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
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

export default DailyDistanceChart;
