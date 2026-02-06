// scripts/deployCommands.js
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) throw new Error("DISCORD_TOKEN missing");
if (!CLIENT_ID) throw new Error("CLIENT_ID missing");

// DEPLOY_MODE: "guild" (default) or "global"
const MODE = (process.env.DEPLOY_MODE || "guild").toLowerCase();
if (MODE !== "guild" && MODE !== "global") {
  throw new Error('DEPLOY_MODE must be "guild" or "global"');
}

const GUILD_ID = process.env.GUILD_ID || process.env.DEV_GUILD_ID || "";
if (MODE === "guild" && !GUILD_ID) {
  throw new Error("DEV_GUILD_ID (or GUILD_ID) missing for guild deploy");
}

const commandsDir = path.join(process.cwd(), "src", "commands");
if (!fs.existsSync(commandsDir)) throw new Error(`Missing: ${commandsDir}`);

const files = fs
  .readdirSync(commandsDir, { withFileTypes: true })
  .filter(d => d.isFile() && d.name.endsWith(".js"))
  .map(d => d.name)
  .sort();

const payload = [];

for (const file of files) {
  const fullPath = path.join(commandsDir, file);

  const mod = await import(pathToFileURL(fullPath).href);
  const cmd =
    mod.default ??
    (mod.data && mod.execute ? { data: mod.data, execute: mod.execute } : null);

  if (!cmd?.data?.toJSON) continue;

  payload.push(cmd.data.toJSON());
  console.log(`✅ Loaded command: ${cmd.data.name}`);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

if (MODE === "global") {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: payload });
  console.log(`✅ Commands deployed globally (${payload.length})`);
} else {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: payload });
  console.log(`✅ Commands deployed to guild ${GUILD_ID} (${payload.length})`);
}
