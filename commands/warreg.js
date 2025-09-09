const { SlashCommandBuilder } = require("discord.js");

const STATUS_EMOJI = {
  c: ":white_check_mark:",
  csub: ":exclamation:",
  mb: ":question:",
  ct: ":x:",
};

function parseTokens(raw) {
  const tokens = raw.trim().split(/\s+/);
  const updates = new Map();
  const regex = /^(csub|c|mb|ct)(\d{2})$/i;
  for (const t of tokens) {
    const m = t.match(regex);
    if (!m) return { error: true };
    const status = m[1].toLowerCase();
    const hour = Number(m[2]);
    if (hour < 0 || hour > 23) return { error: true };
    updates.set(hour, status);
  }
  return { error: false, updates };
}

function ensureChannelState(client, channelId) {
  if (!client.registrations[channelId]) {
    client.registrations[channelId] = Array.from({ length: 24 }, () => ({}));
  }
  return client.registrations[channelId];
}

function buildSummary(channelState, settings) {
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
  return ["Current registrations by hour:", "", lines.join("\n")].join("\n");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warreg")
    .setDescription(
      "Register your availability/unavailability by hour, e.g. 'c20 mb21'."
    )
    .addStringOption((o) =>
      o
        .setName("entries")
        .setDescription("Space-separated entries like c20 csub22 mb21 ct23")
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString("entries", true);
    const { error, updates } = parseTokens(input);
    if (error) {
      return interaction.reply({
        content:
          "Invalid format. Use entries like 'c20 mb21 csub22 ct23' with 00-23 hours. Type /help if you need more information.",
        ephemeral: true,
      });
    }

    const channelId = interaction.channelId;
    const channelState = ensureChannelState(interaction.client, channelId);
    const userId = interaction.user.id;

    // Permission gate: only admin or configured role can start an empty channel
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

    for (const [hour, status] of updates.entries()) {
      channelState[hour][userId] = { status, ts: Date.now() };
    }

    const settings = interaction.client.getChannelSettings?.(channelId) || {
      stayMessage: true,
      startHour: 0,
    };
    const summary = buildSummary(channelState, settings);
    const client = interaction.client;
    const channel = interaction.channel;
    const existingMsgId = client.summaryMessages?.[channelId];
    const hasAny = channelState.some((h) => Object.keys(h).length > 0);
    try {
      if (settings.stayMessage === false) {
        // Always create new message
        await channel.send({
          content: summary,
          allowedMentions: { parse: [] },
        });
      } else if (!hasAny) {
        // Force new message when there are no registrations
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
