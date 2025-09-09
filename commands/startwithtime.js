const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

function canConfigure(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  const cfgRole = interaction.client.config.roles?.[interaction.guildId];
  if (!cfgRole) return false;
  return interaction.member.roles.cache.some((r) => r.name === cfgRole);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startwithtime")
    .setDescription("Set the hour (00-23) where the summary starts")
    .addIntegerOption((o) =>
      o
        .setName("hour")
        .setDescription("Hour from 00 to 23")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(23)
    ),
  async execute(interaction) {
    if (!canConfigure(interaction)) {
      return interaction.reply({
        content: "No permission. Type /help if you need more information.",
        ephemeral: true,
      });
    }
    const hour = interaction.options.getInteger("hour", true);
    const channelId = interaction.channelId;
    const settings = interaction.client.getChannelSettings(channelId);
    settings.startHour = hour;
    await interaction.reply({
      content: `startHour set to ${hour.toString().padStart(2, "0")}`,
      ephemeral: true,
    });
  },
};
