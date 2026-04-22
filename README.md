# Workouts Page

![CI](https://github.com/ben-29/workouts_page/workflows/CI/badge.svg)
[![Deploy to GitHub Pages](https://github.com/ben-29/workouts_page/workflows/Publish%20GitHub%20Pages/badge.svg)](https://ben-29.github.io/workouts_page/)

[简体中文](README-CN.md) | English

Multi-sport support version of [running_page](https://github.com/yihong0618/running_page).

## Features

- Support multiple sport types: running, cycling, swimming, hiking, rowing, etc.
- Support multiple data sources: Strava, Nike, Garmin, Keep, Coros, etc.
- Sync data from Strava to Garmin or vice versa
- Auto-generate GitHub contribution graph style SVGs

---

## Table of Contents

- [Quick Start](#quick-start)
- [Data Source Configuration](#data-source-configuration)
- [GitHub Actions Auto-Sync](#github-actions-auto-sync)
- [Local Development](#local-development)
- [Customization](#customization)

---

## Quick Start

### 1. Fork This Repository

Click **Fork** in the top-right corner to create your own copy.

### 2. Configure GitHub Secrets

Go to repository **Settings → Secrets and variables → Actions** and add the following secrets:

#### Common Configuration

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `STRAVA_CLIENT_ID` | Strava App Client ID | Required for Strava sync |
| `STRAVA_CLIENT_SECRET` | Strava App Client Secret | Required for Strava sync |
| `STRAVA_CLIENT_REFRESH_TOKEN` | Strava Refresh Token | Required for Strava sync |

#### Garmin (only required if using Garmin features)

| Secret Name | Description |
|-------------|-------------|
| `GARMIN_COM_USERNAME` | Garmin International username (email) |
| `GARMIN_COM_PASSWORD` | Garmin International password |
| `GARMIN_CN_USERNAME` | Garmin China username (email) |
| `GARMIN_CN_PASSWORD` | Garmin China password |

#### Strava Web Login (for downloading activity files to Garmin)

| Secret Name | Description |
|-------------|-------------|
| `STRAVA_JWT` | Strava JWT token or `_strava4_session` cookie value |

### 3. Create a Strava Application

1. Visit [Strava Developers](https://www.strava.com/settings/api)
2. Create an application:
   - Application Name: anything
   - Category: Data Analysis
   - Website: `https://github.com/your-username/workouts_page`
   - Authorization Callback Domain: `github.com`
3. Get `Client ID`, `Client Secret`
4. Click "Authorize" on Strava API page to get `Refresh Token`

---

## Data Source Configuration

Edit the environment variables in `.github/workflows/run_data_sync.yml`:

```yaml
env:
  RUN_TYPE: strava  # Data source type
  ATHLETE: Your Name  # Display name on page
  TITLE: Your Name's Workouts  # Page title
```

### Supported RUN_TYPE

| Type | Description | Required Secrets |
|------|-------------|------------------|
| `strava` | Sync from Strava | STRAVA_* |
| `garmin` | Sync from Garmin International | GARMIN_COM_* |
| `garmin_cn` | Sync from Garmin China | GARMIN_CN_* |
| `keep` | Sync from Keep | KEEP_MOBILE, KEEP_PASSWORD |
| `coros` | Sync from Coros | COROS_ACCOUNT, COROS_PASSWORD |
| `nike` | Sync from Nike | NIKE_REFRESH_TOKEN |
| `strava_to_garmin` | Download from Strava and upload to Garmin | STRAVA_*, GARMIN_*, STRAVA_JWT |
| `garmin_to_strava` | Upload from Garmin to Strava | STRAVA_*, GARMIN_* |

---

## GitHub Actions Auto-Sync

### Workflow

1. **Run Data Sync** - Scheduled auto-sync (every 6 hours) or manual trigger
2. **CI** - Validate code changes
3. **Publish GitHub Pages** - Build and publish site

### Manual Trigger Sync

1. Go to repository **Actions** page
2. Select **Run Data Sync** workflow
3. Click **Run workflow** → Select master branch

---

## Local Development

### 1. Install Dependencies

```bash
pip install -r requirements.txt

# Install stravalib 2.0+ and stravaweblib separately
pip install 'stravalib>=2.0.0'
pip install stravaweblib --no-deps
```

### 2. Configure Environment Variables

```bash
export STRAVA_CLIENT_ID="your-client-id"
export STRAVA_CLIENT_SECRET="your-client-secret"
export STRAVA_CLIENT_REFRESH_TOKEN="your-refresh-token"
```

### 3. Run Sync

```bash
# Sync Strava data
python run_page/strava_sync.py $STRAVA_CLIENT_ID $STRAVA_CLIENT_SECRET $STRAVA_CLIENT_REFRESH_TOKEN

# Sync Garmin data
python run_page/garmin_sync.py

# Download from Strava and upload to Garmin
python run_page/strava_to_garmin_sync.py $STRAVA_CLIENT_ID $STRAVA_CLIENT_SECRET $STRAVA_CLIENT_REFRESH_TOKEN "" "" $STRAVA_JWT
```

### 4. Local Preview

```bash
pnpm install
pnpm run dev
```

---

## Dependencies

### Core Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `stravalib` | >=2.0.0 | Strava OAuth API access |
| `stravaweblib` | - | Strava Web session (for downloading activity files) |
| `garminconnect` | - | Garmin Connect API (International) |
| `garth` | - | Garmin China API |
| `sqlalchemy` | - | Database ORM |
| `arrow` | - | Date/time handling |
| `geopy` | - | Geolocation |

### Authentication Mechanisms

#### Strava Authentication (stravalib)
- Uses OAuth 2.0 with Client ID/Secret/Refresh Token
- Only for reading activity list and metadata

#### Strava Web Login (stravaweblib)
- Uses JWT token or `_strava4_session` cookie
- For downloading original activity files (TCX/FIT)

#### Garmin Authentication
- **International (COM)**: Uses `garminconnect` library, requires username/password
- **China (CN)**: Uses `garth` library, requires username/password

---

## Customization

### Change Page Title and Name

Edit `.github/workflows/run_data_sync.yml`:

```yaml
env:
  ATHLETE: Your Name
  TITLE: Your Name's Workouts
```

### Change Minimum Distance Filter

```yaml
MIN_GRID_DISTANCE: 10  # Minimum distance in km for grid map display
```

### Enable Monthly Life Graph

```yaml
GENERATE_MONTH_OF_LIFE: true  # Generate monthly life graph
BIRTHDAY_MONTH: 1986-12       # Format: YYYY-MM
```

---

## FAQ

### Q: Strava sync succeeded but site shows empty data?

Make sure `SAVE_DATA_IN_GITHUB_CACHE` is set to `false` so data is pushed to the repository.

### Q: Garmin login failed (429 Rate Limited)?

Garmin has rate limits on frequent logins.建议：
1. Reduce sync frequency
2. Wait a few minutes and try again
3. Use saved session tokens

### Q: How to sync only running data?

Add `--only-run` parameter:
```bash
python run_page/strava_sync.py ... --only-run
```

---

## References

- [running_page](https://github.com/yihong0618/running_page) - Original project
- [stravalib](https://github.com/stravalib/stravalib) - Strava Python client
- [garminconnect](https://github.com/cyberjunky/python-garminconnect) - Garmin Connect client
- [garth](https://github.com/matin/garth) - Garmin China API client
