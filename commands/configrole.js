const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("configrole")
    .setDescription("Set the role name allowed to run /clear")
    .addStringOption((o) =>
      o
        .setName("role_name")
        .setDescription("Role name that can run /clear")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const roleName = interaction.options.getString("role_name", true);
    const guildId = interaction.guildId;
    const client = interaction.client;

    client.config.roles[guildId] = roleName;
    try {
      fs.writeFileSync(
        path.join(__dirname, "..", "config.json"),
        JSON.stringify(client.config, null, 2),
        "utf8"
      );
    } catch (e) {
      console.error(e);
      return interaction.reply({
        content: "Failed to persist configuration.",
        ephemeral: true,
      });
    }

    await interaction.reply({ content: `Role set to: ${roleName}` });
  },
};
