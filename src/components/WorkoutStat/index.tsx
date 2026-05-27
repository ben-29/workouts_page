import { intComma } from '@/utils/utils';

const WorkoutStat = ({
  value,
  description,
  pace,
  className,
  distance,
  onClick,
}: {
  value: string;
  description: string;
  pace: string;
  className: string;
  distance: string;
  onClick: (_year: string) => void;
}) => (
  <div className={`${className || ' '} pb-1`} onClick={onClick}>
    <span className={`text-5xl font-bold italic`}>{intComma(value)}</span>
    <span className="text-2xl font-semibold italic">{description}</span>
    {pace && <span className="text-5xl font-bold italic">{' ' + pace}</span>}
    {pace && <span className="text-2xl font-semibold italic"> Pace</span>}

    {distance && (
      <span className="text-5xl font-bold italic">{' ' + distance}</span>
    )}
    {distance && <span className="text-2xl font-semibold italic"> KM</span>}
  </div>
);

export default WorkoutStat;
