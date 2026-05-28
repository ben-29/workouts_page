import { intComma } from '@/utils/utils';

interface IStatProperties {
  value: string | number;
  description: string;
  className?: string;
  citySize?: number;
  format?: 'comma' | 'plain';
  onClick?: () => void;
}

const Stat = ({
  value,
  description,
  className = 'pb-1 w-full',
  citySize,
  format = 'plain',
  onClick,
}: IStatProperties) => {
  const sizeClass =
    citySize === 5
      ? 'text-5xl'
      : citySize === 3
        ? 'text-3xl'
        : 'text-[2.65rem]';
  const displayValue =
    format === 'comma' ? intComma(value.toString()) : value.toString();

  return (
    <div className={`${className}`} onClick={onClick}>
      <span className={`${sizeClass} leading-none font-bold italic`}>
        {displayValue}
      </span>
      <span className="text-lg leading-none font-semibold italic">
        {description}
      </span>
    </div>
  );
};

export default Stat;
