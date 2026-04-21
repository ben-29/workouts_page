import { globSync } from 'vite';

export const yearStats = globSync('./year_*.svg', {
  cwd: __dirname,
  import: 'ReactComponent',
});
export const yearSummaryStats = globSync('./year_summary_*.svg', {
  cwd: __dirname,
  import: 'ReactComponent',
});
export const githubYearStats = globSync('./github_*.svg', {
  cwd: __dirname,
  import: 'ReactComponent',
});
export const totalStat = globSync(
  ['./github.svg', './grid.svg', './mol.svg'],
  { cwd: __dirname, import: 'ReactComponent' }
);
