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
    void year;
    return ['Total', ...years];
  }, [years, year]);

  // for short solution need to refactor
  return (
    <div className="w-full pb-8">
      {yearsArrayUpdate.map((yearItem, index) => (
        <YearStat
          key={yearItem}
          year={yearItem}
          onClick={onClick}
          onClickTypeInYear={onClickTypeInYear}
          showDivider={index < yearsArrayUpdate.length - 1}
        />
      ))}
    </div>
  );
};

export default YearsStat;
