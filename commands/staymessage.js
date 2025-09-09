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
    .setName("staymessage")
    .setDescription(
      "Toggle if summary message is edited (true) or always new (false)"
    )
    .addBooleanOption((o) =>
      o
        .setName("value")
        .setDescription("true = edit same message, false = always new")
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!canConfigure(interaction)) {
      return interaction.reply({
        content: "No permission. Type /help if you need more information.",
        ephemeral: true,
      });
    }
    const value = interaction.options.getBoolean("value", true);
    const channelId = interaction.channelId;
    const settings = interaction.client.getChannelSettings(channelId);
    settings.stayMessage = value;
    await interaction.reply({
      content: `stayMessage set to ${value}`,
      ephemeral: true,
    });
  },
};
