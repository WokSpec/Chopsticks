# Rate Limit Operations

## 1. Runtime Overrides (Environment Variables)
Override `rate_limit_config.json` defaults via environment variables.

### Variable Patterns
`RL_{CATEGORY|COMMAND}_LIMIT`
`RL_{CATEGORY|COMMAND}_WINDOW` (seconds)

### Examples
| Variable | Targets | Default |
|----------|---------|---------|
| `RL_AI_LIMIT` | `category:ai` | 3 |
| `RL_MOD_WINDOW` | `category:mod` | 30s |
| `RL_BAN_LIMIT` | `command:ban` | 2 |

### Applying Changes
```bash
# Docker Compose
RL_AI_LIMIT=10 docker-compose up -d bot

# Kubernetes
kubectl set env deployment/bot RL_AI_LIMIT=10
```

---

## 2. Monitoring & Alerts (PromQL)
**Metric:** `chopsticks_ratelimit_hit_total{command, guild_id}`

### Common Queries
- **Global Hit Rate:** `sum(rate(chopsticks_ratelimit_hit_total[5m]))`
- **Hot Commands:** `topk(5, sum by (command) (rate(chopsticks_ratelimit_hit_total[5m])))`
- **Abusive Guilds:** `topk(10, sum by (guild_id) (rate(chopsticks_ratelimit_hit_total[5m])))`

---

## 3. Emergency Overrides
### Via Redis (Reset a Guild)
```bash
# Delete all rate limit keys for a guild
redis-cli --scan --pattern "chopsticks:rl:*:guild_<ID>:*" | xargs redis-cli DEL

# Set a 10x multiplier for 1 hour
redis-cli SET chopsticks:rl_override:guild_<ID> '{"multiplier":10,"expires_at":<EPOCH>}' EX 3600
```

---

## 4. Redis Failure & Recovery
### Fallback Mode
When Redis is offline, the bot reverts to **in-memory** rate-limiting (per-process only).

### Recovery Steps
1. **Verify Connectivity:** `redis-cli -u $REDIS_URL ping`.
2. **Check Logs:** `kubectl logs deploy/bot | grep "Redis unavailable"`.
3. **Restart:** Perform a rolling restart once Redis is stable to clear memory-fallback state.
   ```bash
   kubectl rollout restart deployment/bot
   ```
