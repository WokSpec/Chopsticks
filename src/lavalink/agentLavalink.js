// src/lavalink/agentLavalink.js
import { LavalinkManager } from "lavalink-client";

// One LavalinkManager per agent client.
// Sessions are keyed by `${guildId}:${voiceChannelId}` to allow multi-channel per guild (via multiple agents).
export function createAgentLavalink(agentClient) {
  if (!agentClient?.user?.id) throw new Error("agent-client-not-ready");

  let manager = null;
  let rawHooked = false;

  const ctxBySession = new Map(); // sessionKey -> ctx
  const locks = new Map(); // sessionKey -> Promise chain

  function ensureRawHook() {
    if (rawHooked) return;
    rawHooked = true;

    agentClient.on("raw", d => {
      try {
        manager?.sendRawData(d);
      } catch {}
    });
  }

  function bindErrorHandlersOnce() {
    if (!manager) return;
    if (manager.__chopsticksBound) return;
    manager.__chopsticksBound = true;

    // Prevent process-killing unhandled 'error' events.
    try {
      manager.on("error", err => {
        console.error("[agent:lavalink:manager:error]", err?.message ?? err);
      });
    } catch {}

    try {
      manager.nodeManager?.on?.("disconnect", node => {
        console.error("[agent:lavalink:node:disconnect]", node?.options?.id ?? "node");
      });
      manager.nodeManager?.on?.("reconnecting", node => {
        console.error("[agent:lavalink:node:reconnecting]", node?.options?.id ?? "node");
      });
      manager.nodeManager?.on?.("error", (node, err) => {
        console.error(
          "[agent:lavalink:node:error]",
          node?.options?.id ?? "node",
          err?.message ?? err
        );
      });
    } catch {}
  }

  async function start() {
    if (manager) return manager;

    manager = new LavalinkManager({
      nodes: [
        {
          id: "main",
          host: process.env.LAVALINK_HOST || "localhost",
          port: Number(process.env.LAVALINK_PORT) || 2333,
          authorization: process.env.LAVALINK_PASSWORD || "youshallnotpass"
        }
      ],
      sendToShard: (guildId, payload) => {
        const guild = agentClient.guilds.cache.get(guildId);
        guild?.shard?.send(payload);
      },
      client: {
        id: agentClient.user.id,
        username: agentClient.user.username
      },
      autoSkip: true,
      playerOptions: {
        defaultSearchPlatform: "ytsearch",
        onDisconnect: { autoReconnect: true, destroyPlayer: false },
        onEmptyQueue: { destroyAfterMs: 300_000 }
      }
    });

    ensureRawHook();
    bindErrorHandlersOnce();

    await manager.init({ id: agentClient.user.id, username: agentClient.user.username });
    return manager;
  }

  function sessionKey(guildId, voiceChannelId) {
    return `${guildId}:${voiceChannelId}`;
  }

  function normalizeSearchQuery(input) {
    const q = String(input ?? "").trim();
    if (!q) return "";
    if (/^https?:\/\//i.test(q)) return q;
    return `ytsearch:${q}`;
  }

  function withSessionLock(key, fn) {
    const prev = locks.get(key) ?? Promise.resolve();
    const next = prev
      .catch(() => {})
      .then(fn)
      .finally(() => {
        // keep chain short
        if (locks.get(key) === next) locks.delete(key);
      });

    locks.set(key, next);
    return next;
  }

  async function createOrGetSession({ guildId, voiceChannelId, textChannelId, ownerId }) {
    if (!manager) throw new Error("lavalink-not-ready");

    const key = sessionKey(guildId, voiceChannelId);
    return withSessionLock(key, async () => {
      const existing = ctxBySession.get(key);
      if (existing) return existing;

      const player = manager.createPlayer({
        guildId,
        voiceChannelId,
        textChannelId,
        selfDeaf: true,
        volume: 100
      });

      await player.connect();

      const ctx = {
        player,
        guildId,
        voiceChannelId,
        textChannelId,
        ownerId,
        lastActive: Date.now()
      };

      ctxBySession.set(key, ctx);
      return ctx;
    });
  }

  function getSession(guildId, voiceChannelId) {
    return ctxBySession.get(sessionKey(guildId, voiceChannelId)) ?? null;
  }

  function assertOwner(ctx, userId) {
    if (ctx.ownerId !== userId) throw new Error("not-owner");
  }

  async function search(ctx, query, requester) {
    const identifier = normalizeSearchQuery(query);
    if (!identifier) return { tracks: [] };
    if (typeof ctx?.player?.search !== "function") throw new Error("player-search-missing");
    return ctx.player.search({ query: identifier }, requester);
  }

  async function enqueueAndPlay(ctx, track) {
    ctx.lastActive = Date.now();
    await ctx.player.queue.add(track);
    if (!ctx.player.playing) await ctx.player.play();
  }

  function skip(ctx) {
    ctx.lastActive = Date.now();
    if (typeof ctx.player.skip === "function") ctx.player.skip();
  }

  function pause(ctx, state) {
    ctx.lastActive = Date.now();
    if (typeof ctx.player.pause === "function") ctx.player.pause(state);
  }

  function bestEffortClearQueue(player) {
    const q = player?.queue;
    if (!q) return;

    if (typeof q.clear === "function") return q.clear();
    if (Array.isArray(q)) return void (q.length = 0);
    if (Array.isArray(q.tracks)) return void (q.tracks.length = 0);
    if (typeof q.splice === "function" && typeof q.length === "number") return void q.splice(0, q.length);
  }

  function destroySession(guildId, voiceChannelId) {
    const key = sessionKey(guildId, voiceChannelId);
    const ctx = ctxBySession.get(key);
    if (!ctx) return;

    try {
      if (typeof ctx.player.destroy === "function") ctx.player.destroy();
    } catch {}

    ctxBySession.delete(key);
  }

  function stop(ctx) {
    ctx.lastActive = Date.now();
    try {
      bestEffortClearQueue(ctx.player);
      if (typeof ctx.player.stop === "function") ctx.player.stop();
    } finally {
      destroySession(ctx.guildId, ctx.voiceChannelId);
    }
  }

  return {
    start,
    createOrGetSession,
    getSession,
    assertOwner,
    search,
    enqueueAndPlay,
    skip,
    pause,
    stop,
    destroySession
  };
}
