const { SlashCommandBuilder } = require("discord.js");
const base = require("./can.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("maybe")
    .setDescription("Register hours as maybe (mb)")
    .addStringOption((o) =>
      o
        .setName("hours")
        .setDescription("Space-separated hours like '20 21 22'")
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString("hours", true);
    const parsed = (function parseHours(raw) {
      const tokens = raw.trim().split(/\s+/);
      const hours = new Set();
      const regex = /^(\d{2})$/;
      for (const t of tokens) {
        const m = t.match(regex);
        if (!m) return { error: true };
        const hour = Number(m[1]);
        if (hour < 0 || hour > 23) return { error: true };
        hours.add(hour);
      }
      return { error: false, hours };
    })(input);
    if (parsed.error) {
      return interaction.reply({
        content:
          "Invalid hours (00-23). Type /help if you need more information.",
        ephemeral: true,
      });
    }
    const channelId = interaction.channelId;
    const channelState = (function ensureChannelState(client, channelId) {
      if (!client.registrations[channelId]) {
        client.registrations[channelId] = Array.from(
          { length: 24 },
          () => ({})
        );
      }
      return client.registrations[channelId];
    })(interaction.client, channelId);
    const hasAdmin = interaction.memberPermissions?.has?.(
      require("discord.js").PermissionFlagsBits.Administrator
    );
    const cfgRole = interaction.client.config.roles?.[interaction.guildId];
    const hasRole = cfgRole
      ? interaction.member.roles.cache.some((r) => r.name === cfgRole)
      : false;
    const channelIsEmpty = channelState.every(
      (h) => Object.keys(h).length === 0
    );
    if (!hasAdmin && !hasRole && channelIsEmpty) {
      return interaction.reply({
        content:
          "This channel has no registrations yet. Only admins or the configured role can start a list.",
        ephemeral: true,
      });
    }
    const userId = interaction.user.id;
    for (const h of parsed.hours) {
      channelState[h][userId] = { status: "mb", ts: Date.now() };
    }
    const settings = interaction.client.getChannelSettings?.(channelId) || {
      stayMessage: true,
      startHour: 0,
    };
    const summary = (function buildSummary(channelState, settings) {
      const STATUS_EMOJI = {
        c: ":white_check_mark:",
        csub: ":exclamation:",
        mb: ":question:",
        ct: ":x:",
      };
      const lines = [];
      const start = Number(settings?.startHour || 0) % 24;
      for (let i = 0; i < 24; i++) {
        const h = (start + i) % 24;
        const perHour = channelState[h];
        const users = Object.entries(perHour);
        if (users.length === 0) continue;
        const byStatus = new Map();
        for (const [userId, value] of users) {
          const isObj = value && typeof value === "object";
          const status = isObj ? value.status : value;
          const ts = isObj ? value.ts || 0 : 0;
          if (!byStatus.has(status)) byStatus.set(status, []);
          byStatus.get(status).push({ userId, ts });
        }
        const parts = [];
        for (const status of ["c", "csub", "mb", "ct"]) {
          const items = byStatus.get(status);
          if (items && items.length) {
            items.sort((a, b) => a.ts - b.ts);
            const mentions = items.map((i) => `<@${i.userId}>`);
            parts.push(`${STATUS_EMOJI[status]} ${mentions.join(" ")}`);
          }
        }
        const hh = h.toString().padStart(2, "0");
        const cCount = (byStatus.get("c") || []).length;
        const csubCount = (byStatus.get("csub") || []).length;
        const total = cCount + csubCount;
        const suffix =
          total === 3
            ? " (+3)"
            : total === 4
            ? " (+2)"
            : total === 5
            ? " (+1)"
            : "";
        lines.push(`\`${hh}:00\`${suffix} - ${parts.join(" ")}`);
      }
      if (lines.length === 0) return "No registrations yet.";
      return ["Current registrations by hour:", "", lines.join("\n")].join(
        "\n"
      );
    })(channelState, settings);
    const client = interaction.client;
    const channel = interaction.channel;
    const existingMsgId = client.summaryMessages?.[channelId];
    const hasAny = channelState.some((h) => Object.keys(h).length > 0);
    try {
      if (settings.stayMessage === false) {
        await channel.send({
          content: summary,
          allowedMentions: { parse: [] },
        });
      } else if (!hasAny) {
        const sent = await channel.send({
          content: summary,
          allowedMentions: { parse: [] },
        });
        if (!client.summaryMessages) client.summaryMessages = {};
        client.summaryMessages[channelId] = sent.id;
      } else if (!existingMsgId) {
        const sent = await channel.send({
          content: summary,
          allowedMentions: { parse: [] },
        });
        if (!client.summaryMessages) client.summaryMessages = {};
        client.summaryMessages[channelId] = sent.id;
      } else {
        const msg = await channel.messages
          .fetch(existingMsgId)
          .catch(() => null);
        if (msg) {
          await msg.edit({ content: summary, allowedMentions: { parse: [] } });
        } else {
          const sent = await channel.send({
            content: summary,
            allowedMentions: { parse: [] },
          });
          if (!client.summaryMessages) client.summaryMessages = {};
          client.summaryMessages[channelId] = sent.id;
        }
      }
    } catch (e) {
      console.error(e);
    }
    await interaction.reply({
      content: "Registered successfully.",
      ephemeral: true,
    });
  },
};
