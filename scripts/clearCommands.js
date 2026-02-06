// scripts/clearCommands.js
import "dotenv/config";
import { REST, Routes } from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) throw new Error("DISCORD_TOKEN missing");
if (!CLIENT_ID) throw new Error("CLIENT_ID missing");

// CLEAR_MODE: "guild" (default) or "global"
const MODE = (process.env.CLEAR_MODE || "guild").toLowerCase();
if (MODE !== "guild" && MODE !== "global") {
  throw new Error('CLEAR_MODE must be "guild" or "global"');
}

const GUILD_ID = process.env.GUILD_ID || process.env.DEV_GUILD_ID || "";
if (MODE === "guild" && !GUILD_ID) {
  throw new Error("DEV_GUILD_ID (or GUILD_ID) missing for guild clear");
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

if (MODE === "global") {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
  console.log("[clear] global: cleared");
} else {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
  console.log(`[clear] guild(${GUILD_ID}): cleared`);
}
