import {
  getVoiceState,
  saveVoiceState
} from "./schema.js";

/* ---------- LOCKS (PROCESS-LOCAL) ---------- */

const creationLocks = new Map();

function lockKey(guildId, lockId) {
  return `${guildId}:${lockId}`;
}

export function acquireCreationLock(guildId, lockId) {
  const key = lockKey(guildId, lockId);
  if (creationLocks.has(key)) return false;
  creationLocks.set(key, true);
  return true;
}

export function releaseCreationLock(guildId, lockId) {
  creationLocks.delete(lockKey(guildId, lockId));
}

/* ---------- STATE ACCESS ---------- */

export function ensureVoiceState(_) {
  // NO-OP BY DESIGN
  // Schema is authoritative
}

/* ---------- TEMP CHANNEL MUTATION (SCHEMA-SAFE) ---------- */

export function registerTempChannel(
  guildId,
  channelId,
  ownerId,
  lobbyId,
  voiceOverride = null
) {
  const voice = voiceOverride ?? getVoiceState(guildId);

  if (!voice.lobbies[lobbyId]) return;

  voice.tempChannels[channelId] = {
    ownerId,
    lobbyId
  };

  saveVoiceState(guildId, voice);
}

export function removeTempChannel(
  guildId,
  channelId,
  voiceOverride = null
) {
  const voice = voiceOverride ?? getVoiceState(guildId);

  if (voice.tempChannels[channelId]) {
    delete voice.tempChannels[channelId];
    saveVoiceState(guildId, voice);
  }
}

export function findUserTempChannel(
  guildId,
  userId,
  lobbyId,
  voiceOverride = null
) {
  const voice = voiceOverride ?? getVoiceState(guildId);

  for (const [channelId, temp] of Object.entries(
    voice.tempChannels
  )) {
    if (
      temp.ownerId === userId &&
      temp.lobbyId === lobbyId
    ) {
      return channelId;
    }
  }

  return null;
}
