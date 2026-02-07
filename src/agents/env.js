// src/agents/env.js
export function readAgentTokensFromEnv(env = process.env) {
  const rawList = String(env.AGENT_TOKENS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (rawList.length > 0) return rawList;

  // explicit slots so you can reason about which bots are deployed
  const keys = [
    "AGENT_0001_TOKEN",
    "AGENT_0002_TOKEN",
    "AGENT_0003_TOKEN",
    "AGENT_0004_TOKEN",
    "AGENT_0005_TOKEN"
  ];

  return keys.map(k => env[k]).filter(Boolean);
}
