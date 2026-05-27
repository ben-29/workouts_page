# Cleopas Strava

Cleopas Strava is a personal activity archive and visualization site for Strava data. It presents route maps, activity tables, yearly summaries, and generated heatmap statistics as a compact public record of outdoor movement.

Live site: [https://cleopas-strava.vercel.app](https://cleopas-strava.vercel.app)

## Data Source

The dataset is synchronized from Strava through the Strava API and stored in this repository for static publication. Imported activity names are preserved from Strava, while site labels and documentation are written in English.

## Attribution

This project is adapted from the open-source `running_page` ecosystem, especially [HelloWorldComputer/running_page](https://github.com/HelloWorldComputer/running_page) and the original [yihong0618/running_page](https://github.com/yihong0618/running_page). The adaptation focuses on Cleopas Fang's personal Strava archive, visual presentation, and deployment workflow.

## Privacy Note

The site publishes only the activity data intentionally synchronized into the repository. Strava credentials and refresh tokens are managed through GitHub Actions secrets and are not stored in the source tree.
