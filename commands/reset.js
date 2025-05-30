const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Elimina todas las elecciones del servidor.")
    .setDescriptionLocalization("en-US", "Delete all votings in the server.")
    .setDescriptionLocalization(
      "fr",
      "Supprimer toutes les élections du serveur."
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
    if (
      !interaction.client.electionData ||
      !interaction.client.electionData[interaction.guildId] ||
      Object.keys(interaction.client.electionData[interaction.guildId])
        .length === 0
    ) {
      return interaction.reply({
        content:
          strings.no_elections_to_delete ||
          strings.no_votings_to_delete ||
          "No hay votaciones para eliminar.",
        ephemeral: true,
      });
    }
    interaction.client.electionData[interaction.guildId] = {};
    await interaction.reply({
      content:
        strings.all_elections_deleted ||
        strings.all_votings_deleted ||
        "Todas las votaciones han sido eliminadas.",
      ephemeral: true,
    });
  },
};
