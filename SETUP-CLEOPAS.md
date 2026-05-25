# Cleopas Workouts Page Setup

This repository is prepared for a Strava-powered Vercel deployment based on `ben-29/workouts_page`.

## Local Workspace

Use WSL for development and Git operations. The project lives at:

`/home/cleopas_fang/GitHub/strava`

This is under the WSL filesystem, so `pnpm install`, Vite builds, and Python scripts should be much faster than running from `/mnt/c/...`.

## GitHub

Create or fork a repository under `shuncleopasfang`:

`https://github.com/shuncleopasfang/strava`

Then set this local repo's `origin` to that URL and push `master`.

## Required Strava Secrets

Add these GitHub Actions repository secrets:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_CLIENT_REFRESH_TOKEN`

Do not commit these values into the repository.

Strava's official API docs say the OAuth token exchange uses the app's client ID and client secret to obtain a refresh token, and the getting-started docs remind users not to share client secrets or tokens publicly:

- https://developers.strava.com/docs/authentication
- https://developers.strava.com/docs/getting-started/

## Vercel

Import the GitHub repo into Vercel.

Use the default Vite settings:

- Framework preset: `Vite`
- Build command: `pnpm build`
- Output directory: `dist`

After the GitHub Action syncs new Strava data and commits it, Vercel should redeploy automatically from `master`.

## First Sync

After secrets are set, run GitHub Actions workflow `Run Data Sync` manually once.

The workflow is already configured for:

- `RUN_TYPE=strava`
- `ATHLETE=cleopas_fang`
- `BUILD_GH_PAGES=false`

The site data has been cleared so the first real deployment will not show ben-29's historical workouts.
