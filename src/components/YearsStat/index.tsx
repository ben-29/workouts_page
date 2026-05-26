import { useMemo } from 'react';
import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';

const YearsStat = ({
  year,
  onClick,
  onClickTypeInYear,
}: {
  year: string;
  onClick: (_year: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
}) => {
  const { years } = useActivities();

  // Memoize the years array calculation
  const yearsArrayUpdate = useMemo(() => {
    if (year === 'Total') return ['Total', ...years];
    return [year, ...years.filter((x) => x !== year), 'Total'];
  }, [years, year]);

  // for short solution need to refactor
  return (
    <div className="w-full pb-8 lg:w-full">
      {yearsArrayUpdate.map((yearItem) => (
        <YearStat
          key={yearItem}
          year={yearItem}
          onClick={onClick}
          onClickTypeInYear={onClickTypeInYear}
        />
      ))}
    </div>
  );
};

export default YearsStat;
