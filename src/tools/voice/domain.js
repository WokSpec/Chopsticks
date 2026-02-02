import { loadGuildData, saveGuildData } from "../../utils/storage.js";
import { ensureVoiceState } from "./state.js";
import {
  validateVoiceState,
  domainAddLobby,
  domainRemoveLobby,
  domainSetLobbyEnabled,
  domainResetVoice
} from "./domain.js";

/* ---------- ADD LOBBY ---------- */

export async function addLobby(
  guildId,
  channelId,
  categoryId,
  template
) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);
  validateVoiceState(data);

  const result = domainAddLobby(data.voice, {
    channelId,
    categoryId,
    template
  });

  if (!result.ok) return result;

  saveGuildData(guildId, data);
  return { ok: true };
}

/* ---------- REMOVE ---------- */

export async function removeLobby(guildId, channelId) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);
  validateVoiceState(data);

  const result = domainRemoveLobby(data.voice, { channelId });
  if (!result.ok) return result;

  saveGuildData(guildId, data);
  return { ok: true };
}

/* ---------- ENABLE / DISABLE ---------- */

export async function setLobbyEnabled(
  guildId,
  channelId,
  enabled
) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);
  validateVoiceState(data);

  const result = domainSetLobbyEnabled(data.voice, {
    channelId,
    enabled
  });

  if (!result.ok || result.noop) return result;

  saveGuildData(guildId, data);
  return { ok: true };
}

/* ---------- RESET ---------- */

export async function resetVoice(guildId) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);
  validateVoiceState(data);

  domainResetVoice(data.voice);
  saveGuildData(guildId, data);
}

/* ---------- STATUS ---------- */

export async function getStatus(guildId) {
  const data = loadGuildData(guildId);
  ensureVoiceState(data);
  validateVoiceState(data);
  return data.voice;
}
