const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("open")
    .setDescription("Abre la votación para la elección actual.")
    .setDescriptionLocalization("en-US", "Open voting for the current voting.")
    .setDescriptionLocalization(
      "fr",
      "Ouvrir le vote pour l'élection en cours."
    )
    .addStringOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de la elección")
        .setDescriptionLocalization("en-US", "Name of the voting")
        .setDescriptionLocalization("fr", "Nom de l'élection")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("max_votos")
        .setDescription(
          "Número máximo de personas a las que puede votar cada uno"
        )
        .setDescriptionLocalization(
          "en-US",
          "Maximum number of people each user can vote for"
        )
        .setDescriptionLocalization(
          "fr",
          "Nombre maximum de personnes pour lesquelles chaque utilisateur peut voter"
        )
        .setRequired(true)
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
    if (!nombre) {
      return interaction.reply({
        content: strings.election_name_required,
        ephemeral: true,
      });
    }
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
    const data =
      interaction.client.electionData?.[interaction.guildId]?.[nombre];
    if (!data) {
      return interaction.reply({
        content: strings.no_active_poll,
        ephemeral: true,
      });
    }
    if (data.estado !== "postulacion") {
      return interaction.reply({
        content: strings.no_active_poll,
        ephemeral: true,
      });
    }
    if (!data.postulados || data.postulados.length === 0) {
      return interaction.reply({
        content: strings.no_candidates_with_name.replace("{name}", nombre),
        ephemeral: true,
      });
    }
    data.estado = "votacion";
    data.maxVotos = interaction.options.getInteger("max_votos");
    data.votos = {}; // { userId: [postuladoIndex, ...] }
    const person_word =
      data.maxVotos === 1
        ? strings.one_candidate
          ? "persona"
          : "person"
        : lang === "es"
        ? "personas"
        : lang === "fr"
        ? "personnes"
        : "people";
    let texto = strings.open_poll
      .replace("{name}", nombre)
      .replace("{max}", data.maxVotos)
      .replace("{person_word}", person_word)
      .replace(
        "{candidates}",
        data.postulados.map((id, i) => `${i + 1}. <@${id}>`).join("\n")
      );
    await interaction.reply({ content: texto });
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
      .filter(
        ([_, v]) => v && typeof v === "object" && v.estado === "postulacion"
      )
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
