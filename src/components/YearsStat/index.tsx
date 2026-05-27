import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';

const YearsStat = ({
  year,
  onClick,
}: {
  year: string;
  onClick: (_year: string) => void;
}) => {
  const { years } = useActivities();
  void year;
  const yearsArrayUpdate = ['Total'].concat(years.slice());

  return (
    <div className="w-full pb-16 pr-8">
      {yearsArrayUpdate.map((yearItem) => (
        <YearStat key={yearItem} year={yearItem} onClick={onClick} />
      ))}
    </div>
  );
};

export default YearsStat;
