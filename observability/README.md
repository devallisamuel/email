# Local observability

Start the API, worker, PostgreSQL, Loki, Prometheus, and Grafana together:

```bash
docker compose up --build -d
```

Open the local tools:

| Tool | Address | Purpose |
| --- | --- | --- |
| Grafana | http://localhost:3300 | Search logs and graph metrics. |
| Prometheus | http://localhost:9090 | Run PromQL queries and inspect scrape targets. |
| Loki | http://localhost:3100 | Loki HTTP API. |
| Email API metrics | http://localhost:3000/metrics | Raw Prometheus metrics from the application. |

Grafana gets both data sources automatically. Sign in with `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` from `.env` (or the local defaults of `admin` / `admin`). Change the password before sharing the stack.

In Grafana, open **Explore** and select **Loki**. Useful LogQL searches are:

```logql
{service="email-service"}
{service="email-service", component="worker"}
{service="email-service", component="api"} |= "POST /emails"
```

Select **Prometheus** in Explore for metrics. Useful PromQL queries are:

```promql
sum by (route, status_code) (email_api_http_requests_total)
histogram_quantile(0.95, sum by (le, route) (rate(email_api_http_request_duration_seconds_bucket[5m])))
```
