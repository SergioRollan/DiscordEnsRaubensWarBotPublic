const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Elimina una elección por su nombre.")
    .setDescriptionLocalization("en-US", "Delete a voting by its name.")
    .setDescriptionLocalization("fr", "Supprimer une élection par son nom.")
    .addStringOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de la elección a eliminar")
        .setDescriptionLocalization("en-US", "Name of the voting to delete")
        .setDescriptionLocalization("fr", "Nom de l'élection à supprimer")
        .setRequired(true)
        .setAutocomplete(true)
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
    const nombre = interaction.options.getString("nombre");
    const elections = interaction.client.electionData?.[interaction.guildId];
    if (!elections || !elections[nombre]) {
      return interaction.reply({
        content: strings.election_not_found.replace("{name}", nombre),
        ephemeral: true,
      });
    }
    // Comprobación de rol autorizado
    const config = interaction.client.electionConfig?.[interaction.guildId];
    if (config && config.rol) {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const tieneRol = member.roles.cache.some((r) => r.name === config.rol);
      if (!tieneRol) {
        return interaction.reply({
          content: strings.no_permission,
          ephemeral: true,
        });
      }
    }
    delete elections[nombre];
    await interaction.reply({
      content: strings.election_deleted.replace("{name}", nombre),
      ephemeral: true,
    });
  },
  async autocomplete(interaction) {
    let lang =
      interaction.client.electionConfig?.[interaction.guildId]?.language ||
      "en";
    let strings;
    try {
      strings = JSON.parse(fs.readFileSync(`./strings/${lang}.json`, "utf8"));
    } catch {
      strings = JSON.parse(fs.readFileSync("./strings/en.json", "utf8"));
    }
    const elections =
      interaction.client.electionData?.[interaction.guildId] || {};
    // Filtrar solo elecciones válidas (que sean objetos con estado)
    const choices = Object.entries(elections)
      .filter(([_, v]) => v && typeof v === "object" && v.estado !== "cerrado")
      .map(([k]) => k);
    if (choices.length === 0) {
      await interaction.respond([]);
      return;
    }
    const focused = interaction.options.getFocused();
    const filtered = choices
      .filter((name) => name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25);
    await interaction.respond(filtered.map((name) => ({ name, value: name })));
  },
};
