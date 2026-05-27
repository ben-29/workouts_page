import { intComma } from '@/utils/utils';

interface IStatProperties {
  value: string | number;
  description: string;
  className?: string;
  citySize?: number;
  onClick?: () => void;
}

const Stat = ({
  value,
  description,
  className = 'pb-1 w-full',
  citySize,
  onClick,
}: IStatProperties) => {
  const sizeClass =
    citySize === 5 ? 'text-5xl' : citySize === 3 ? 'text-3xl' : 'text-4xl';

  return (
    <div className={`${className}`} onClick={onClick}>
      <span className={`${sizeClass} leading-none font-bold italic`}>
        {intComma(value.toString())}
      </span>
      <span className="text-base leading-none font-semibold italic">
        {description}
      </span>
    </div>
  );
};

export default Stat;
