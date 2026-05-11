# Security Guardrails

## 1. Discord Intents
| Intent | Mandatory | Prohibited |
|--------|-----------|------------|
| `Guilds`, `GuildMembers`, `GuildVoiceStates` | YES | - |
| `GuildMessages`, `MessageContent` (Privileged) | YES | - |
| `GuildModeration` | YES | - |
| `GuildPresences`, `GuildMessageTyping` | - | YES |

## 2. Permission Model
### Prohibited (Never Grant)
- `Administrator`
- `ManageServer`
- `ManageWebhooks`

### Mandatory (Invite Scope)
`BanMembers`, `KickMembers`, `ModerateMembers`, `ManageMessages`, `ManageRoles`, `Connect`, `Speak`, `MuteMembers`, `DeafenMembers`, `MoveMembers`, `SendMessages`, `EmbedLinks`, `AttachFiles`, `ReadMessageHistory`, `AddReactions`, `UseExternalEmojis`, `UseApplicationCommands`, `ViewAuditLog`.

## 3. Command Access Control
| Category | Permission Gate |
|----------|-----------------|
| `mod` | `ModerateMembers` OR `BanMembers` |
| `admin` | `ManageGuild` |
| `music`, `fun`, `economy` | None (Default) |

**Requirement:** All `mod`/`admin` commands must invoke `setDefaultMemberPermissions()` and verify `meta.userPerms`.

## 4. Secrets & Rotation
- **Master Key:** `AGENT_TOKEN_KEY` (AES-256-GCM). Rotated every 90 days.
- **Rotation:** `openssl rand -hex 32`. Re-link all guild keys post-rotation.
- **Storage:** No secrets in source. Use `.env` (gitignored) or Vault.
- **Verification:** Run `node scripts/check-env.js` at startup.

## 5. Rate Limits (Defaults)
| Category | Limit | Window |
|----------|-------|--------|
| `mod`, `assistant` | 3 | 30s |
| `admin` | 5 | 60s |
| `fun`, `economy` | 12 | 10s |
| `sensitive` | 3 | 5m (1hr block) |

## 6. Audit & Logging
- **Mandatory:** All mod/destructive actions must use `dispatchModerationLog()`.
- **Constraint:** Never log tokens, keys, or PII.

## 7. Pre-Merge Checklist
- [ ] `meta.userPerms` verified.
- [ ] `setDefaultMemberPermissions()` set.
- [ ] Rate limit category applied.
- [ ] No secrets in source.
- [ ] Audit log dispatch included.
- [ ] Error messages redacted (no stack traces).
- [ ] `npm audit` passes (High/Critical).
