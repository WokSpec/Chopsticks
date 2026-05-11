# Incident Runbook

## Severity Definitions
- **P1:** Total service outage.
- **P2:** Partial degradation or specific feature failure.

---

## P1: Service Offline
**Symptoms:** Bot appears offline; `/health` unreachable; `ChopsticksProcessDown` alert.

### Diagnosis
```bash
docker ps --filter name=chopsticks-bot
docker logs --tail 100 chopsticks-bot
df -h && free -m
```

### Fix
```bash
# 1. Restart
docker compose restart bot

# 2. Redeploy
docker compose pull bot && docker compose up -d bot

# 3. Rollback
docker tag chopsticks-bot:<tag> chopsticks-bot:production
docker compose up -d bot
```

---

## P2: Command Failures
**Symptoms:** "Something went wrong" errors; `ChopsticksCommandErrorSpike` alert.

### Diagnosis
```bash
docker logs --tail 200 chopsticks-bot | grep -i error
npm run deploy-commands -- --check
```

### Fix
```bash
# Re-register commands
npm run deploy-commands -- --env production

# Restart process
docker compose restart bot
```

---

## P2: Database/Redis Failure
**Symptoms:** "Database error" embeds; `/health` reports DB/Redis error.

### Diagnosis (DB)
```bash
docker ps --filter name=postgres
docker logs --tail 50 chopsticks-postgres
docker exec -it chopsticks-postgres psql -U <user> -c "SELECT 1;"
```

### Diagnosis (Redis)
```bash
docker exec -it chopsticks-redis redis-cli ping
docker exec -it chopsticks-redis redis-cli info memory
```

---

## P2: Voice/Lavalink Failure
**Symptoms:** Music commands fail; `ChopsticksVoiceFailure` alert.

### Fix
```bash
docker compose -f docker-compose.lavalink.yml restart lavalink
docker compose restart bot
```

---

## P1: Security Incident (Token Leak)
**Immediate Actions:**
1. **Reset Token:** Discord Developer Portal -> Reset Token.
2. **Update Env:** Update `DISCORD_TOKEN` in `.env.production`.
3. **Restart:** `docker compose up -d --force-recreate bot`.
4. **Audit:** Review audit logs for unauthorized actions.
