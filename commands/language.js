const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("language")
    .setDescription("Cambia el idioma del bot.")
    .addStringOption((option) =>
      option
        .setName("idioma")
        .setNameLocalization("en-US", "language")
        .setNameLocalization("fr", "langue")
        .setDescription("Idioma: es, en o fr")
        .setDescriptionLocalization("en-US", "Language: es, en or fr")
        .setDescriptionLocalization("fr", "Langue : es, en ou fr")
        .setRequired(true)
        .addChoices(
          { name: "Español", value: "es" },
          { name: "English", value: "en" },
          { name: "Français", value: "fr" }
        )
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
    const idioma = interaction.options.getString("idioma");
    if (!interaction.client.electionConfig)
      interaction.client.electionConfig = {};
    if (!interaction.client.electionConfig[interaction.guildId])
      interaction.client.electionConfig[interaction.guildId] = {};
    interaction.client.electionConfig[interaction.guildId].language = idioma;
    await interaction.reply({
      content: `Idioma configurado a: **${idioma}**`,
      ephemeral: false,
    });
  },
};
