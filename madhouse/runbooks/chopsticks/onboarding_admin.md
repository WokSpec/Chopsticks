# Admin Onboarding Runbook — Discord Bot

## 1. Invite and Permissions

### Invite URL Template
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8589934591&scope=bot%20applications.commands
```

### Essential Scopes
- `bot`: Join server.
- `applications.commands`: Slash command registration.

### Core Permissions
| Permission | Critical Features |
|---|---|
| `Manage Messages` | Pinning, moderation, scheduled messages |
| `Manage Channels` | Lockdown, ticket routing |
| `Manage Roles` | Auto-role, access control |
| `Moderate Members` | Timeout, notes, history |
| `Connect / Speak` | Voice/Music features |

---

## 2. Technical Setup Sequence

### Step 1: Initialize
Run `/setup` to start the interactive wizard or follow manual steps below.

### Step 2: Logging
```bash
/config set mod_log_channel channel:#mod-log
```

### Step 3: Access Control
```bash
/config set mod_role role:@Moderator
/config set admin_role role:@Admin
```

### Step 4: Member Lifecycle
```bash
/config set welcome_channel channel:#welcome
/config set autorole role:@Member
```

### Step 5: Support System
```bash
/config set ticket_category category:Support
/tickets panel channel:#support-info
```

### Step 6: Verification
Run `/ping` and `/suggest text:"Verification test"` to confirm end-to-end functionality.

---

## 3. Operational Command Reference

| Command | Action |
|---|---|
| `/config view` | Audit current guild settings |
| `/lockdown` | Emergency channel/category lock |
| `/antispam set` | Configure rate-limiting and burst thresholds |
| `/massban` | Bulk user removal |
| `/ai persona set` | Configure LLM persona for the guild |
| `/history` | Inspect user moderation audit trail |
