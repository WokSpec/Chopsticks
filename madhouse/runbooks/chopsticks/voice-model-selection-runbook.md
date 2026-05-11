# Voice Model Selection Runbook

## Purpose
Link LLM provider keys (Anthropic, OpenAI, Ollama) to enable server-specific voice AI features.

## Prerequisites
- Server Admin privileges (`Manage Guild`).
- Valid API key for the chosen provider.
- For Ollama: `OLLAMA_URL` must be reachable from the bot host.

## 1. Enable/Link Provider
1. **Select Provider:** Run `/model set <anthropic|openai|ollama>`.
2. **Link Key:** Use `/model link` to open a secure modal and paste the API key.
3. **Verification:** The bot performs a non-billing health call. Status flips to `configured` on success.

## 2. Token Management
- **Rotate:** Use `/model link` with a new key; the old key is securely overwritten.
- **Disable:** Run `/model unset` to remove the stored token and revert to default behavior.

## 3. Security
- Tokens are encrypted at rest using `AGENT_TOKEN_KEY`.
- Never paste keys into public channels; always use the `/model link` modal.

## 4. Troubleshooting
- **Validation Failed:** Check key permissions and model access.
- **Ollama Offline:** Verify container status and network connectivity.
- **Emergency Reset:** Run `/model unset` to stop all custom AI processing.

