import { ComponentType } from 'react';

type SvgModule = Record<string, ComponentType<any>>;

const FailedLoadSvg = () => {
  console.log('Failed to load SVG component');
  return <div></div>;
};

export const loadSvgComponent = (
  stats: SvgModule,
  path: string
): ComponentType<any> => {
  return stats[path] || FailedLoadSvg;
};
