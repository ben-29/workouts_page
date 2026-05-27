import { useMemo } from 'react';
import type { Activity } from '@/utils/utils';

interface ContributionHeatmapProps {
  activities: Activity[];
}

const HALF_MARATHON_KM = 21.0975;
const FULL_MARATHON_KM = 42.195;
const M_TO_KM = 1000;
const EMPTY_COLOR = '#ebedf0';
const GITHUB_GREENS = ['#9be9a8', '#40c463', '#30a14e', '#216e39'];

const colorForDistance = (distanceKm: number) => {
  if (distanceKm <= 0) return EMPTY_COLOR;
  if (distanceKm < 10) return GITHUB_GREENS[0];
  if (distanceKm < HALF_MARATHON_KM) return GITHUB_GREENS[1];
  if (distanceKm < FULL_MARATHON_KM) return GITHUB_GREENS[2];
  return GITHUB_GREENS[3];
};

const getYearDays = (year: number) => {
  const days: Date[] = [];
  const date = new Date(year, 0, 1);
  while (date.getFullYear() === year) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const ContributionHeatmap = ({ activities }: ContributionHeatmapProps) => {
  const { years, distancesByDate } = useMemo(() => {
    const yearSet = new Set<number>();
    const byDate = new Map<string, number>();

    activities.forEach((activity) => {
      const date = activity.start_date_local?.slice(0, 10);
      if (!date) return;
      const year = Number(date.slice(0, 4));
      if (!Number.isNaN(year)) yearSet.add(year);
      byDate.set(date, (byDate.get(date) ?? 0) + (activity.distance ?? 0));
    });

    return {
      years: Array.from(yearSet).sort((a, b) => b - a),
      distancesByDate: byDate,
    };
  }, [activities]);

  return (
    <section className="mt-4 w-full bg-transparent font-sans text-neutral-900">
      <div className="space-y-3">
        {years.map((year) => {
          const days = getYearDays(year);
          const leadingBlanks = days[0].getDay();
          const cells = [
            ...Array.from({ length: leadingBlanks }, (_, index) => ({
              key: `${year}-blank-${index}`,
              color: 'transparent',
              title: '',
            })),
            ...days.map((date) => {
              const dateText = dateKey(date);
              const distanceKm = (distancesByDate.get(dateText) ?? 0) / M_TO_KM;
              return {
                key: dateText,
                color: colorForDistance(distanceKm),
                title: `${dateText}: ${distanceKm.toFixed(1)} KM`,
              };
            }),
          ];

          return (
            <div
              className="grid grid-cols-[3.5rem_1fr] items-start gap-2"
              key={year}
            >
              <div className="pt-5 text-sm font-medium text-neutral-700">
                {year}
              </div>
              <div className="min-w-0">
                <div className="mb-1 grid grid-cols-12 text-[10px] text-neutral-500">
                  {[
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
                  ].map((month) => (
                    <span key={`${year}-${month}`}>{month}</span>
                  ))}
                </div>
                <div
                  className="grid grid-flow-col grid-rows-7 justify-start gap-[3px]"
                  style={{
                    gridTemplateColumns: 'repeat(53, minmax(0, 10px))',
                  }}
                >
                  {cells.map((cell) => (
                    <span
                      aria-label={cell.title}
                      className="h-[10px] w-[10px] rounded-[2px] border border-black/5"
                      key={cell.key}
                      style={{ backgroundColor: cell.color }}
                      title={cell.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-neutral-500">
        <span>Less</span>
        <span className="h-[10px] w-[10px] rounded-[2px] bg-[#ebedf0]" />
        {GITHUB_GREENS.map((color) => (
          <span
            className="h-[10px] w-[10px] rounded-[2px]"
            key={color}
            style={{ backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>
    </section>
  );
};

export default ContributionHeatmap;
