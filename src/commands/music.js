// src/commands/music.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import {
  ensureSessionAgent,
  getSessionAgent,
  releaseSession,
  sendAgentCommand,
  formatMusicError
} from "../music/service.js";

export const data = new SlashCommandBuilder()
  .setName("music")
  .setDescription("Voice-channel music (agent-backed, one session per voice channel)")
  .addSubcommand(s =>
    s.setName("play")
      .setDescription("Play or queue a track in your current voice channel")
      .addStringOption(o =>
        o.setName("query")
          .setDescription("Search or URL")
          .setRequired(true)
      )
  )
  .addSubcommand(s => s.setName("skip").setDescription("Skip current track"))
  .addSubcommand(s => s.setName("pause").setDescription("Pause playback"))
  .addSubcommand(s => s.setName("resume").setDescription("Resume playback"))
  .addSubcommand(s => s.setName("stop").setDescription("Stop playback"))
  .addSubcommand(s => s.setName("now").setDescription("Show current track"));

function requireVoice(interaction) {
  const member = interaction.member;
  const vc = member?.voice?.channel ?? null;
  if (!vc) return { ok: false, vc: null };
  return { ok: true, vc };
}

function buildRequester(user) {
  return {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar
  };
}

async function safeDeferEphemeral(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    return { ok: true };
  } catch (err) {
    const code = err?.code;
    if (code === 10062) return { ok: false, reason: "unknown-interaction" };
    throw err;
  }
}

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const sub = interaction.options.getSubcommand();

  const voiceCheck = requireVoice(interaction);
  if (!voiceCheck.ok) {
    await interaction.reply({ content: "Join a voice channel.", flags: MessageFlags.Ephemeral });
    return;
  }
  const vc = voiceCheck.vc;

  try {
    if (sub === "play") {
      const ack = await safeDeferEphemeral(interaction);
      if (!ack.ok) return;

      await interaction.editReply({ content: "Searching..." });

      const alloc = ensureSessionAgent(guildId, vc.id, {
        textChannelId: interaction.channelId,
        ownerUserId: userId
      });

      if (!alloc.ok) {
        await interaction.editReply({ content: formatMusicError(alloc.reason) });
        return;
      }

      const query = interaction.options.getString("query", true);

      let result;
      try {
        result = await sendAgentCommand(alloc.agent, "play", {
          guildId,
          voiceChannelId: vc.id,
          textChannelId: interaction.channelId,
          ownerUserId: userId,
          query,
          requester: buildRequester(interaction.user)
        });
      } catch (err) {
        await interaction.editReply({ content: formatMusicError(err) });
        return;
      }

      const track = result?.track ?? null;
      if (!track) {
        await interaction.editReply({ content: "No results." });
        return;
      }

      await interaction.editReply({
        content: "",
        embeds: [
          new EmbedBuilder()
            .setTitle("Now Playing")
            .setDescription(track.title ?? "Unknown title")
        ]
      });
      return;
    }

    const sess = getSessionAgent(guildId, vc.id);
    if (!sess.ok) {
      await interaction.reply({
        content: "Nothing playing in this channel.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const opMap = {
      skip: "skip",
      pause: "pause",
      resume: "resume",
      stop: "stop",
      now: "status"
    };

    const op = opMap[sub];
    if (!op) {
      await interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral });
      return;
    }

    const ack = await safeDeferEphemeral(interaction);
    if (!ack.ok) return;

    let result;
    try {
      result = await sendAgentCommand(sess.agent, op, {
        guildId,
        voiceChannelId: vc.id,
        textChannelId: interaction.channelId,
        ownerUserId: userId
      });
    } catch (err) {
      if (String(err?.message ?? err) === "no-session") {
        releaseSession(guildId, vc.id);
      }
      await interaction.editReply({ content: formatMusicError(err) });
      return;
    }

    if (sub === "now") {
      const current = result?.current ?? null;
      if (!current) {
        await interaction.editReply({ content: "Nothing playing in this channel." });
        return;
      }

      await interaction.editReply({
        embeds: [new EmbedBuilder().setTitle("Now Playing").setDescription(current.title ?? "Unknown title")]
      });
      return;
    }

    if (sub === "stop") {
      releaseSession(guildId, vc.id);
      await interaction.editReply({ content: "OK" });
      return;
    }

    await interaction.editReply({ content: "OK" });
  } catch (err) {
    const msg = formatMusicError(err);

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: msg });
      } else {
        await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
      }
    } catch {}

    throw err;
  }
}
