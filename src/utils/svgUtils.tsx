import { ComponentType } from 'react';

type SvgComponent = {
  default: ComponentType<any>;
};

type SvgModule = Record<string, () => Promise<unknown>> | Record<string, unknown>;

const FailedLoadSvg = () => {
  console.log('Failed to load SVG component');
  return <div></div>;
};

export const loadSvgComponent = async (
  stats: SvgModule,
  path: string
): Promise<SvgComponent> => {
  try {
    const loader = stats[path];
    if (!loader) {
      return { default: FailedLoadSvg };
    }
    const module =
      typeof loader === 'function' ? await (loader as () => Promise<unknown>)() : loader;
    return { default: (module as { default: ComponentType<any> }).default };
  } catch (error) {
    console.error(error);
    return { default: FailedLoadSvg };
  }
};
