const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra información sobre los comandos del bot.")
    .setDescriptionLocalization(
      "en-US",
      "Show information about the bot commands."
    )
    .setDescriptionLocalization(
      "fr",
      "Afficher des informations sur les commandes du bot."
    ),
  async execute(interaction) {
    let lang =
      interaction.client.electionConfig?.[interaction.guildId]?.language ||
      "en";
    let strings;
    try {
      strings = JSON.parse(fs.readFileSync(`./strings/${lang}.json`, "utf8"));
    } catch {
      strings = JSON.parse(fs.readFileSync("./strings/en.json", "utf8"));
    }
    const config = interaction.client.electionConfig?.[interaction.guildId];
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isAdmin = member.permissions.has("Administrator");
    let rolConfig = config?.rol ? config.rol.trim().toLowerCase() : null;
    let tieneRol = rolConfig
      ? member.roles.cache.some(
          (r) => r.name.trim().toLowerCase() === rolConfig
        )
      : false;
    if (isAdmin) {
      await interaction.reply({
        content:
          strings.help.replace(/\n*$/, "") + (strings.help_last_line || ""),
        ephemeral: true,
      });
      return;
    }
    if (tieneRol) {
      await interaction.reply({
        content:
          strings.help_role.replace(/\n*$/, "") +
          (strings.help_last_line || ""),
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
      content:
        strings.help_vote_only.replace(/\n*$/, "") +
        (strings.help_last_line || ""),
      content: strings.help_vote_only,
      ephemeral: true,
    });
  },
};
