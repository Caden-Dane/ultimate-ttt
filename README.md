# Dallas Weather AI

This repository contains a simple static web application that fetches a 7‑day weather forecast for Dallas, Texas using the Open‑Meteo API and allows visitors to interact with an AI assistant about the upcoming weather.

## How it works

- **Data source:** The app uses the [Open‑Meteo Forecast API](https://open-meteo.com/) to fetch hourly temperature, precipitation probability and wind speed data. Open‑Meteo is a free, open‑source weather API that offers high‑resolution forecasts without requiring an API key【716028439260051†L14-L24】. The API combines global and mesoscale models to provide hourly forecasts up to 16 days ahead【716028439260051†L60-L71】 and updates local models every hour【716028439260051†L73-L78】. Access is free for non‑commercial use with no registration needed【716028439260051†L121-L126】.
- **Forecast processing:** The JavaScript code groups the hourly data into daily summaries (high/low temperature, average precipitation probability, average wind speed) for the next seven days.
- **AI assistant:** Visitors can type questions in the chat box. By default, a simple rule‑based system answers questions using the processed forecast data. If you have an OpenAI API key and want more conversational responses, you can enable the integration by setting `USE_OPENAI` to `true` and providing your `OPENAI_API_KEY` in `script.js`.

## Running locally

No build step is required. Simply serve the folder with any static file server:

```bash
# Using Python's built‑in server
cd dallas-weather-app
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.

## Hosting on GitHub Pages

1. Create a new repository on GitHub and push the contents of `dallas-weather-app` to the root.
2. In the repository settings, enable GitHub Pages and choose the `main` branch as the source.
3. Wait for the deployment to complete. Your site will be available at `https://<username>.github.io/<repository>/`.

## Configuration

If you wish to use OpenAI for more natural responses:

1. Obtain an API key from [OpenAI](https://platform.openai.com/).
2. In `script.js`, set `USE_OPENAI` to `true` and set your `OPENAI_API_KEY`.
3. Optionally change `OPENAI_MODEL` to a model you have access to (e.g., `gpt-4`).

Please note that calls to OpenAI are subject to CORS restrictions when served from GitHub Pages. If you encounter issues, consider proxying the request or sticking with the built‑in rule‑based assistant.