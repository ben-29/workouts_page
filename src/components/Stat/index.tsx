import { intComma } from '@/utils/utils';

interface IStatProperties {
  value: string | number;
  description: string;
  className?: string;
  citySize?: number;
  onClick?: () => void;
}

const textSizeClass = (citySize?: number) => {
  if (citySize === 4) return 'text-4xl';
  if (citySize === 5) return 'text-5xl';
  if (citySize === 6) return 'text-6xl';
  return 'text-3xl';
};

const Stat = ({
  value,
  description,
  className = 'pb-1 w-full',
  citySize,
  onClick,
}: IStatProperties) => (
  <div className={`${className}`} onClick={onClick}>
    <span
      className={`${textSizeClass(citySize)} font-bold italic text-zinc-950`}
    >
      {intComma(value.toString())}
    </span>
    <span className="text-sm font-semibold italic text-zinc-900">
      {description}
    </span>
  </div>
);

export default Stat;
