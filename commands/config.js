const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configura el rol autorizado para gestionar elecciones.")
    .setDescriptionLocalization(
      "en-US",
      "Set the authorized role to manage votings."
    )
    .setDescriptionLocalization(
      "fr",
      "Configurer le rôle autorisé pour gérer les élections."
    )
    .addStringOption((option) =>
      option
        .setName("rol")
        .setDescription("Nombre del rol autorizado")
        .setDescriptionLocalization("en-US", "Name of the authorized role")
        .setDescriptionLocalization("fr", "Nom du rôle autorisé")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Solo admins
    if (!interaction.member.permissions.has("Administrator")) {
      let lang =
        interaction.client.electionConfig?.[interaction.guildId]?.language ||
        "en";
      let strings;
      try {
        strings = JSON.parse(
          require("fs").readFileSync(`./strings/${lang}.json`, "utf8")
        );
      } catch {
        strings = JSON.parse(
          require("fs").readFileSync("./strings/en.json", "utf8")
        );
      }
      return interaction.reply({ content: strings.no_admin, ephemeral: true });
    }
    let lang =
      interaction.client.electionConfig?.[interaction.guildId]?.language ||
      "en";
    let strings;
    try {
      strings = JSON.parse(fs.readFileSync(`./strings/${lang}.json`, "utf8"));
    } catch {
      strings = JSON.parse(fs.readFileSync("./strings/en.json", "utf8"));
    }
    const nombreRol = interaction.options.getString("rol");
    if (!interaction.client.electionConfig)
      interaction.client.electionConfig = {};
    interaction.client.electionConfig[interaction.guildId] = {
      rol: nombreRol,
      language: lang,
    };
    await interaction.reply({
      content: strings.config_set.replace("{role}", nombreRol),
      ephemeral: false,
    });
  },
};
