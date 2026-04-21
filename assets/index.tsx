export const yearStats = import.meta.glob('./assets/year_*.svg', {
  import: 'ReactComponent',
  eager: true,
});
export const yearSummaryStats = import.meta.glob('./assets/year_summary_*.svg', {
  import: 'ReactComponent',
  eager: true,
});
export const githubYearStats = import.meta.glob('./assets/github_*.svg', {
  import: 'ReactComponent',
  eager: true,
});
export const totalStat = import.meta.glob(
  [
    './assets/github.svg',
    './assets/grid.svg',
    './assets/mol.svg',
    './assets/mol_running.svg',
    './assets/mol_walking.svg',
    './assets/mol_hiking.svg',
    './assets/mol_cycling.svg',
    './assets/mol_swimming.svg',
    './assets/mol_skiing.svg',
  ],
  { import: 'ReactComponent', eager: true }
);
