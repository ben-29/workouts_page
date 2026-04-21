import { ComponentType } from 'react';

type SvgComponent = {
  default: ComponentType<any>;
};

type SvgModule = Record<string, ComponentType<any>>;

const FailedLoadSvg = () => {
  console.log('Failed to load SVG component');
  return <div></div>;
};

export const loadSvgComponent = (
  stats: SvgModule,
  path: string
): SvgComponent => {
  const component = stats[path];
  if (!component) {
    return { default: FailedLoadSvg };
  }
  return { default: component };
};
