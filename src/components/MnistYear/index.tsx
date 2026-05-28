import mnistDigits from '@/static/mnist-digits.json';

interface MnistYearProps {
  year: number;
}

type DigitKey = keyof typeof mnistDigits;

const PIXEL_SIZE = 28;
const ACTIVE_THRESHOLD = 16;

interface YearDigitSample {
  id: string;
  pixels: number[];
}

const pickSample = (digit: DigitKey) => {
  const samples = mnistDigits[digit];
  return samples[Math.floor(Math.random() * samples.length)];
};

const YEAR_SAMPLE_CACHE = new Map<string, YearDigitSample[]>();

for (let year = 1900; year <= 2100; year += 1) {
  YEAR_SAMPLE_CACHE.set(
    String(year),
    String(year)
      .split('')
      .map((digit, position) => ({
        id: `${year}-${position}-${digit}`,
        pixels: pickSample(digit as DigitKey),
      }))
  );
}

const MnistDigit = ({ pixels }: { pixels: number[] }) => (
  <span className="mnist-digit-tile" aria-hidden="true">
    <svg
      className="mnist-digit-image"
      role="img"
      viewBox={`0 0 ${PIXEL_SIZE} ${PIXEL_SIZE}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {pixels.map((value, index) => {
        if (value <= ACTIVE_THRESHOLD) return null;
        const x = index % PIXEL_SIZE;
        const y = Math.floor(index / PIXEL_SIZE);
        return (
          <rect
            fill="rgb(10 10 10)"
            fillOpacity={Math.max(0.18, value / 255)}
            height="1"
            key={`${x}-${y}`}
            width="1"
            x={x}
            y={y}
          />
        );
      })}
    </svg>
  </span>
);

const MnistYear = ({ year }: MnistYearProps) => {
  const yearText = String(year);
  const samples =
    YEAR_SAMPLE_CACHE.get(yearText) ??
    yearText.split('').map((digit, position) => ({
      id: `${yearText}-${position}-${digit}`,
      pixels: mnistDigits[digit as DigitKey][0],
    }));

  return (
    <div aria-label={yearText} className="mnist-year" role="img">
      {samples.map(({ id, pixels }) => (
        <MnistDigit key={id} pixels={pixels} />
      ))}
    </div>
  );
};

export default MnistYear;
