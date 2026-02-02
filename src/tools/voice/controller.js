// src/tools/voice/controller.js

import { loadGuildData, saveGuildData } from "../../utils/storage.js";
import { ensureVoiceState } from "./state.js";

/* ---------- INTERNAL GUARDS ---------- */

function isTempChannel(voice, channelId) {
  return Boolean(voice.tempChannels[channelId]);
}

function isManagedCategory(voice, categoryId) {
  return Object.values(voice.lobbies).some(
    lobby => lobby.categoryId === categoryId
  );
}

function isSpawnedUnderManagedCategory(voice, channelId) {
  const temp = voice.tempChannels[channelId];
  if (!temp) return false;

  const parentLobby = voice.lobbies[temp.lobbyId];
  if (!parentLobby) return false;

  return true;
}

/* ---------- ADD LOBBY ---------- */

export async function addLobby(
  guildId,
  channelId,
  categoryId,
  template
) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);

  const voice = data.voice;

  /* HARD BLOCK: spawned temp VC */
  if (isTempChannel(voice, channelId)) {
    return { ok: false, reason: "temp-channel" };
  }

  /* HARD BLOCK: channel spawned under managed category */
  if (isSpawnedUnderManagedCategory(voice, channelId)) {
    return { ok: false, reason: "spawned-channel" };
  }

  /* HARD BLOCK: duplicate lobby */
  if (voice.lobbies[channelId]) {
    return { ok: false, reason: "exists" };
  }

  /* HARD BLOCK: category already managed */
  if (isManagedCategory(voice, categoryId)) {
    return { ok: false, reason: "category-bound" };
  }

  voice.lobbies[channelId] = {
    categoryId,
    enabled: false,
    nameTemplate: template
  };

  saveGuildData(guildId, data);
  return { ok: true };
}

/* ---------- REMOVE LOBBY ---------- */

export async function removeLobby(guildId, channelId) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);

  if (!data.voice.lobbies[channelId]) {
    return { ok: false, reason: "missing" };
  }

  delete data.voice.lobbies[channelId];

  for (const [tempId, temp] of Object.entries(data.voice.tempChannels)) {
    if (temp.lobbyId === channelId) {
      delete data.voice.tempChannels[tempId];
    }
  }

  saveGuildData(guildId, data);
  return { ok: true };
}

/* ---------- ENABLE / DISABLE ---------- */

export async function setLobbyEnabled(guildId, channelId, enabled) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);

  const lobby = data.voice.lobbies[channelId];
  if (!lobby) return { ok: false, reason: "missing" };

  if (lobby.enabled === enabled) {
    return { ok: true, noop: true };
  }

  if (enabled) {
    const conflict = Object.entries(data.voice.lobbies).find(
      ([id, l]) =>
        id !== channelId &&
        l.enabled === true &&
        l.categoryId === lobby.categoryId
    );

    if (conflict) {
      return {
        ok: false,
        reason: "category-conflict",
        conflictChannelId: conflict[0]
      };
    }
  }

  lobby.enabled = enabled;
  saveGuildData(guildId, data);
  return { ok: true };
}

/* ---------- RESET ---------- */

export async function resetVoice(guildId) {
  const data = loadGuildData(guildId);
  data.voice = { lobbies: {}, tempChannels: {} };
  saveGuildData(guildId, data);
}

/* ---------- STATUS ---------- */

export async function getStatus(guildId) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);
  return data.voice;
}
