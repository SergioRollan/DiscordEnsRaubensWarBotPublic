const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Vota por los postulados de la elección actual.")
    .setDescriptionLocalization(
      "en-US",
      "Vote for the candidates of the current voting."
    )
    .setDescriptionLocalization(
      "fr",
      "Votez pour les candidats de l'élection en cours."
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
    .addStringOption((option) =>
      option
        .setName("candidatos")
        .setDescription(
          "Números de los postulados a los que votas, separados por comas (ej: 1,3,4)"
        )
        .setDescriptionLocalization(
          "en-US",
          "Numbers of the candidates you vote for, separated by commas (e.g. 1,3,4)"
        )
        .setDescriptionLocalization(
          "fr",
          "Numéros des candidats pour lesquels vous votez, séparés par des virgules (ex : 1,3,4)"
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
    const data =
      interaction.client.electionData?.[interaction.guildId]?.[nombre];
    if (!data) {
      return interaction.reply({
        content: strings.no_active_poll,
        ephemeral: true,
      });
    }
    if (data.estado !== "votacion") {
      return interaction.reply({
        content: strings.no_active_voting,
        ephemeral: true,
      });
    }
    if (!data.postulados || data.postulados.length === 0) {
      return interaction.reply({
        content: strings.no_candidates_with_name.replace("{name}", nombre),
        ephemeral: true,
      });
    }
    const input = interaction.options.getString("candidatos");
    let indices = input.split(/[\,\s]+/).map((x) => parseInt(x.trim(), 10) - 1);
    // Eliminar duplicados
    indices = [...new Set(indices)];
    if (
      indices.some(isNaN) ||
      indices.some((i) => i < 0 || i >= data.postulados.length)
    ) {
      return interaction.reply({
        content: strings.invalid_vote,
        ephemeral: true,
      });
    }
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
    if (indices.length > data.maxVotos) {
      return interaction.reply({
        content: strings.max_votes
          .replace("{max}", data.maxVotos)
          .replace("{person_word}", person_word),
        ephemeral: true,
      });
    }
    data.votos[interaction.user.id] = indices;
    await interaction.reply({
      content: strings.vote_registered,
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
    const choices = Object.entries(elections)
      .filter(([_, v]) => v && typeof v === "object" && v.estado === "votacion")
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
