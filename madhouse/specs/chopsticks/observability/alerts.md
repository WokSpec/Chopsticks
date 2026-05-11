# Prometheus Alert Rules

## 1. Alert Rules YAML
```yaml
groups:
  - name: chopsticks_alerts
    rules:
      # AI Rate Limit Spike
      - alert: ChopsticksAIRateLimitSpike
        expr: sum(increase(chopsticks_rate_limit_hits_total{bucket="ai"}[5m])) > 50
        labels:
          severity: warning
        annotations:
          summary: "High volume of AI rate-limit rejections"
          runbook: "runbooks/chopsticks/incident_runbook.md#p2-rate-limit-alerts-firing"

      # Voice LLM Failure Rate
      - alert: ChopsticksVoiceLLMHighFailureRate
        expr: (sum(rate(chopsticks_voice_llm_calls_total{status="error"}[5m])) / sum(rate(chopsticks_voice_llm_calls_total[5m]))) > 0.10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Voice LLM failure rate exceeds 10%"
          runbook: "runbooks/chopsticks/incident_runbook.md#p2-voicelavalink-down"

      # Command Error Spike
      - alert: ChopsticksCommandErrorSpike
        expr: (sum by (command) (rate(chopsticks_command_errors_total[10m])) / sum by (command) (rate(chopsticks_command_invocations_total[10m]))) > 0.05
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Command {{ $labels.command }} error rate exceeds 5%"
          runbook: "runbooks/chopsticks/incident_runbook.md#p2-commands-returning-errors"

      # Redis Connection Loss
      - alert: ChopsticksRedisConnectionLoss
        expr: chopsticks_redis_health_check_ok == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Redis health check failing"
          runbook: "runbooks/chopsticks/incident_runbook.md#p2-redis-unavailable"
```

## 2. Metric Instrumentation Requirements
| Metric Name | Type | Labels | Description |
|---|---|---|---|
| `chopsticks_rate_limit_hits_total` | Counter | `bucket` | Incremented on rate-limit hit |
| `chopsticks_voice_llm_calls_total` | Counter | `status` | AI API call status (ok/error) |
| `chopsticks_command_errors_total` | Counter | `command` | Unhandled command errors |
| `chopsticks_command_invocations_total` | Counter | `command` | Total command starts |
| `chopsticks_redis_health_check_ok` | Gauge | — | 1 = Healthy, 0 = Unhealthy |
