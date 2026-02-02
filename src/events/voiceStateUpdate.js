// src/events/voiceStateUpdate.js

import { ChannelType, PermissionsBitField } from "discord.js";
import { loadGuildData } from "../utils/storage.js";
import {
  acquireCreationLock,
  releaseCreationLock,
  ensureVoiceState,
  registerTempChannel,
  removeTempChannel,
  findUserTempChannel
} from "../tools/voice/state.js";
import { logger } from "../utils/logger.js";

export default {
  name: "voiceStateUpdate",

  async execute(oldState, newState) {
    const guild = newState.guild ?? oldState.guild;
    if (!guild) return;

    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;

    const data = loadGuildData(guild.id);
    ensureVoiceState(data);

    const voice = data.voice;
    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    /* ---------- LEAVE / CLEANUP ---------- */

    if (oldChannelId && oldChannelId !== newChannelId) {
      const temp = voice.tempChannels[oldChannelId];
      if (temp) {
        const channel = guild.channels.cache.get(oldChannelId);
        if (!channel || channel.members.size === 0) {
          try {
            if (channel) await channel.delete();
          } catch {}
          removeTempChannel(guild.id, oldChannelId);
        }
      }
    }

    /* ---------- JOIN GUARD ---------- */

    if (!newChannelId || newChannelId === oldChannelId) return;

    const lobby = voice.lobbies[newChannelId];
    if (!lobby || lobby.enabled !== true) return;

    /* ---------- USER ALREADY HAS CHANNEL ---------- */

    const existingId = findUserTempChannel(
      guild.id,
      member.id,
      newChannelId
    );

    if (existingId) {
      const existing = guild.channels.cache.get(existingId);
      if (existing) {
        try {
          await member.voice.setChannel(existing);
        } catch {}
        return;
      }
    }

    /* ---------- LOCK ---------- */

    if (!acquireCreationLock(guild.id, member.id)) return;

    try {
      const fresh = loadGuildData(guild.id);
      ensureVoiceState(fresh);

      const freshLobby = fresh.voice.lobbies[newChannelId];
      if (!freshLobby || freshLobby.enabled !== true) return;

      // HARD: always fetch bot member (cache unsafe)
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember) return;

      const perms = botMember.permissions;
      if (
        !perms.has(PermissionsBitField.Flags.ManageChannels) ||
        !perms.has(PermissionsBitField.Flags.MoveMembers)
      ) {
        logger.error("voice: missing permissions", { guildId: guild.id });
        return;
      }

      const category = guild.channels.cache.get(freshLobby.categoryId);
      if (!category || category.type !== ChannelType.GuildCategory) return;

      const channelName = freshLobby.nameTemplate.includes("{user}")
        ? freshLobby.nameTemplate.replace(
            "{user}",
            member.user.username
          )
        : freshLobby.nameTemplate;

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category.id
      });

      registerTempChannel(
        guild.id,
        channel.id,
        member.id,
        newChannelId
      );

      try {
        await member.voice.setChannel(channel);
      } catch {}
    } catch (err) {
      logger.error("voice: temp channel creation failed", {
        guildId: guild.id,
        userId: member.id,
        error: err
      });
    } finally {
      releaseCreationLock(guild.id, member.id);
    }
  }
};
