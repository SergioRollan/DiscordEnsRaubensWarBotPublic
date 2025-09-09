const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

function canRunClear(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  const cfgRole = interaction.client.config.roles?.[interaction.guildId];
  if (!cfgRole) return false;
  const member = interaction.member;
  return member.roles.cache.some((r) => r.name === cfgRole);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear all registrations for this channel")
    .setDMPermission(false),
  async execute(interaction) {
    if (!canRunClear(interaction)) {
      return interaction.reply({
        content:
          "You do not have permission to use this command. Type /help if you need more information.",
        ephemeral: true,
      });
    }

    const channelId = interaction.channelId;
    if (interaction.client.registrations[channelId]) {
      delete interaction.client.registrations[channelId];
    }
    if (interaction.client.summaryMessages?.[channelId]) {
      delete interaction.client.summaryMessages[channelId];
    }
    await interaction.reply({
      content: "All registrations cleared for this channel.",
    });
  },
};
