// src/agents/agentRunner.js
import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import WebSocket from "ws";
import { readAgentTokensFromEnv } from "./env.js";
import { createAgentLavalink } from "../lavalink/agentLavalink.js";

const CONTROL_HOST = process.env.AGENT_CONTROL_HOST || "127.0.0.1";
const CONTROL_PORT = Number(process.env.AGENT_CONTROL_PORT) || 8787;
const CONTROL_URL =
  process.env.AGENT_CONTROL_URL || `ws://${CONTROL_HOST}:${CONTROL_PORT}`;

function agentIdFromIndex(i) {
  const slot = String(i + 1).padStart(4, "0");
  return `agent${slot}`;
}

function safeJsonParse(input) {
  try {
    return JSON.parse(String(input));
  } catch {
    return null;
  }
}

function getHumanCount(channel) {
  if (!channel?.members) return 0;
  let count = 0;
  for (const member of channel.members.values()) {
    if (!member?.user?.bot) count++;
  }
  return count;
}

function serializeTrack(track) {
  if (!track) return null;
  const info = track.info ?? {};
  return {
    title: info.title ?? "Unknown title",
    uri: info.uri ?? null,
    author: info.author ?? null,
    length: info.length ?? null,
    sourceName: info.sourceName ?? null
  };
}

function getQueueTracks(queue) {
  if (!queue) return [];
  if (Array.isArray(queue.tracks)) return queue.tracks;
  if (Array.isArray(queue)) return queue;
  if (Array.isArray(queue.items)) return queue.items;
  return [];
}

async function startAgent(token, index) {
  const agentId = agentIdFromIndex(index);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    partials: [Partials.Channel]
  });

  let lavalink = null;
  let ws = null;
  let wsReady = false;

  function sendWs(payload) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  function sendHello() {
    sendWs({
      type: "hello",
      agentId,
      ready: Boolean(lavalink),
      guildIds: Array.from(client.guilds.cache.keys())
    });
  }

  function sendGuilds() {
    sendWs({
      type: "guilds",
      guildIds: Array.from(client.guilds.cache.keys())
    });
  }

  function sendRelease(guildId, voiceChannelId, reason) {
    sendWs({
      type: "event",
      event: "released",
      agentId,
      guildId,
      voiceChannelId,
      reason: reason ?? "unknown"
    });
  }

  function connectControl() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(CONTROL_URL);
    wsReady = false;

    ws.on("open", () => {
      wsReady = true;
      sendHello();
    });

    ws.on("message", async data => {
      const msg = safeJsonParse(data);
      if (!msg || msg.type !== "req") return;

      const { id, op, data: payload } = msg;
      if (!id || !op) return;

      try {
        const result = await handleRequest(op, payload);
        sendWs({ type: "resp", id, ok: true, data: result ?? null });
      } catch (err) {
        sendWs({
          type: "resp",
          id,
          ok: false,
          error: String(err?.message ?? err)
        });
      }
    });

    ws.on("close", () => {
      wsReady = false;
      setTimeout(connectControl, 2000);
    });

    ws.on("error", () => {});
  }

  async function ensureLavalink() {
    if (lavalink) return lavalink;
    try {
      lavalink = createAgentLavalink(client);
      await lavalink.start();
      return lavalink;
    } catch (err) {
      lavalink = null;
      throw err;
    }
  }

  async function handleRequest(op, payload = {}) {
    const guildId = payload.guildId;
    const voiceChannelId = payload.voiceChannelId;
    const textChannelId = payload.textChannelId;
    const ownerUserId = payload.ownerUserId;

    if (!guildId || !voiceChannelId) throw new Error("missing-session");

    const mgr = await ensureLavalink();

    if (op === "play") {
      const ctx = await mgr.createOrGetSession({
        guildId,
        voiceChannelId,
        textChannelId,
        ownerId: ownerUserId
      });

      if (ownerUserId && ctx.ownerId !== ownerUserId) throw new Error("not-owner");

      const query = payload.query;
      const requester = payload.requester ?? null;
      const res = await mgr.search(ctx, query, requester);
      if (!res?.tracks?.length) return { track: null };
      const track = res.tracks[0];
      await mgr.enqueueAndPlay(ctx, track);
      return { track: serializeTrack(track) };
    }

    const ctx = mgr.getSession(guildId, voiceChannelId);
    if (!ctx) throw new Error("no-session");
    if (ownerUserId && ctx.ownerId !== ownerUserId) throw new Error("not-owner");

    if (op === "skip") {
      mgr.skip(ctx);
      return { ok: true };
    }

    if (op === "pause") {
      mgr.pause(ctx, true);
      return { ok: true };
    }

    if (op === "resume") {
      mgr.pause(ctx, false);
      return { ok: true };
    }

    if (op === "stop") {
      mgr.stop(ctx);
      sendRelease(guildId, voiceChannelId, "stop");
      return { ok: true };
    }

    if (op === "status") {
      const current = ctx.player?.queue?.current ?? null;
      const tracks = getQueueTracks(ctx.player?.queue);
      return {
        playing: Boolean(ctx.player?.playing),
        current: serializeTrack(current),
        queueLength: tracks.length
      };
    }

    if (op === "queue") {
      const current = ctx.player?.queue?.current ?? null;
      const tracks = getQueueTracks(ctx.player?.queue).map(serializeTrack);
      return { current: serializeTrack(current), tracks };
    }

    throw new Error("unknown-op");
  }

  async function stopIfEmpty(channel) {
    if (!channel || !lavalink) return;

    const humanCount = getHumanCount(channel);
    if (humanCount > 0) return;

    const ctx = lavalink.getSession(channel.guild.id, channel.id);
    if (!ctx) return;

    try {
      lavalink.stop(ctx);
    } catch {}

    sendRelease(channel.guild.id, channel.id, "empty-channel");
  }

  client.once("ready", async () => {
    console.log(`✅ Agent ready: ${client.user.tag} (${agentId})`);

    try {
      await ensureLavalink();
    } catch (err) {
      console.error(`[${agentId}] Lavalink init failed`, err?.message ?? err);
    }

    connectControl();

    if (wsReady) sendHello();
  });

  client.on("guildCreate", () => sendGuilds());
  client.on("guildDelete", () => sendGuilds());

  client.on("voiceStateUpdate", async (oldState, newState) => {
    const oldChannel = oldState.channel ?? null;
    const newChannel = newState.channel ?? null;

    if (oldChannel && oldChannel.id !== newChannel?.id) {
      await stopIfEmpty(oldChannel);
    }
  });

  client.on("error", () => {});
  client.on("shardError", () => {});
  client.on("warn", () => {});

  await client.login(token);
}

const tokens = readAgentTokensFromEnv(process.env);
if (tokens.length === 0) throw new Error("No agent tokens configured");

for (let i = 0; i < tokens.length; i++) {
  startAgent(tokens[i], i).catch(err => {
    console.error(`[agent:${i + 1}] startup failed`, err?.message ?? err);
  });
}
