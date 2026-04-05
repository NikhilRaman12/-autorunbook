# AutoRunbook

An AI-powered incident response system that automatically detects production anomalies and generates intelligent runbooks using Google Gemini AI.

## Features
- **Real-time Monitoring**: Tracks latency, error rates, CPU, memory, and availability.
- **Automated Alerting**: Threshold-based detection engine.
- **AI Runbooks**: Uses Gemini 1.5 Flash to generate context-aware fix steps.
- **Chaos Engineering**: Built-in simulation panel to trigger incidents.
- **Prometheus Integration**: Exposes `/api/metrics` for scraping.

## Running Locally
1. Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`.
2. Run `npm install`
3. Run `npm run dev`

## Production Deployment
Use the provided `docker-compose.yml` to spin up the app along with Prometheus and Grafana.
