const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("state")
    .setDescription("Muestra el estado del bot (solo administradores).")
    .setDescriptionLocalization(
      "en-US",
      "Show the bot status (administrators only)."
    )
    .setDescriptionLocalization(
      "fr",
      "Afficher l'état du bot (administrateurs uniquement)."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has("Administrator")) {
      let lang =
        interaction.client.electionConfig?.[interaction.guildId]?.language ||
        "en";
      let strings;
      try {
        strings = JSON.parse(fs.readFileSync(`./strings/${lang}.json`, "utf8"));
      } catch {
        strings = JSON.parse(fs.readFileSync("./strings/en.json", "utf8"));
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
    const config =
      interaction.client.electionConfig?.[interaction.guildId] || {};
    const role = config.rol || "-";
    const elections =
      interaction.client.electionData?.[interaction.guildId] || {};
    const created =
      Object.entries(elections)
        .filter(([_, v]) => v && v.estado === "postulacion")
        .map(([k]) => k)
        .join(", ") || "-";
    const open =
      Object.entries(elections)
        .filter(([_, v]) => v && v.estado === "votacion")
        .map(([k]) => k)
        .join(", ") || "-";
    const msg = strings.state_info
      .replace("{lang}", lang)
      .replace("{role}", role)
      .replace("{created}", created)
      .replace("{open}", open);
    await interaction.reply({ content: msg, ephemeral: true });
  },
};
