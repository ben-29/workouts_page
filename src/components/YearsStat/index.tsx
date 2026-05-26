import { useMemo } from 'react';
import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';
import { INFO_MESSAGE } from '@/utils/const';

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
    let updatedYears = years.slice();
    updatedYears = updatedYears.filter((x) => x !== year);
    updatedYears.unshift(year);
    if (year === 'Total') {
      updatedYears = ['Total', ...years];
    }
    return updatedYears;
  }, [years, year]);

  const infoMessage = useMemo(() => {
    return INFO_MESSAGE(years.length, year);
  }, [years.length, year]);

  // for short solution need to refactor
  return (
    <div className="w-full pr-16 pb-16 lg:w-full lg:pr-16">
      <section className="pb-0">
        <p className="leading-relaxed">
          {infoMessage}
          <br />
        </p>
      </section>
      <hr />
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
