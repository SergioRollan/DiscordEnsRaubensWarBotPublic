const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("view")
    .setDescription("Ver a quién ha votado cada persona (solo para admins).")
    .setDescriptionLocalization(
      "en-US",
      "See who each person has voted for (admins only)."
    )
    .setDescriptionLocalization(
      "fr",
      "Voir pour qui chaque personne a voté (admins uniquement)."
    )
    .addStringOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de la elección")
        .setDescriptionLocalization("en-US", "Name of the voting")
        .setDescriptionLocalization("fr", "Nom de l'élection")
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
    if (!data.votos || !data.postulados || data.postulados.length === 0) {
      return interaction.reply({
        content: strings.no_votes.replace("{name}", nombre),
        ephemeral: true,
      });
    }
    let votosTexto = "";
    for (const [userId, indices] of Object.entries(data.votos)) {
      const nombres = indices.map((i) => `<@${data.postulados[i]}>`).join(", ");
      votosTexto += `<@${userId}> votó a: ${nombres}\n`;
    }
    let texto = strings.votes_view
      .replace("{name}", nombre)
      .replace("{votes}", votosTexto);
    await interaction.reply({ content: texto, ephemeral: true });
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
