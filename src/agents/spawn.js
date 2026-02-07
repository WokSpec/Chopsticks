// src/agents/spawn.js
import { spawn } from "node:child_process";

export function spawnAgentsProcess() {
  // Prevent recursion if agentRunner ever imports main
  if (process.env.CHOPSTICKS_AGENT_CHILD === "1") return null;

  // Only spawn if tokens exist (otherwise you'd spawn a process that immediately crashes)
  const hasTokens =
    Boolean(process.env.AGENT_TOKENS?.trim()) ||
    Boolean(process.env.AGENT_0001_TOKEN) ||
    Boolean(process.env.AGENT_0002_TOKEN) ||
    Boolean(process.env.AGENT_0003_TOKEN) ||
    Boolean(process.env.AGENT_0004_TOKEN) ||
    Boolean(process.env.AGENT_0005_TOKEN);

  if (!hasTokens) return null;

  const child = spawn(process.execPath, ["src/agents/agentRunner.js"], {
    stdio: "inherit",
    env: { ...process.env, CHOPSTICKS_AGENT_CHILD: "1" }
  });

  const stop = () => {
    try {
      child.kill("SIGTERM");
    } catch {}
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  process.once("exit", stop);

  child.on("exit", code => {
    if (code && code !== 0) {
      console.error(`[agents] process exited with code ${code}`);
    }
  });

  return child;
}
