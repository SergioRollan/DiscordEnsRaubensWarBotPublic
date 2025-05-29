const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Cierra la votación y muestra los resultados.")
    .setDescriptionLocalization(
      "en-US",
      "Close the voting and show the results."
    )
    .setDescriptionLocalization(
      "fr",
      "Fermer le vote et afficher les résultats."
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
        .setName("ganadores")
        .setDescription("Número de ganadores a mostrar")
        .setDescriptionLocalization("en-US", "Number of winners to show")
        .setDescriptionLocalization("fr", "Nombre de gagnants à afficher")
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
    // Contar votos
    const conteo = Array(data.postulados.length).fill(0);
    for (const votos of Object.values(data.votos)) {
      for (const idx of votos) {
        conteo[idx]++;
      }
    }
    // Ordenar por votos
    const resultados = data.postulados.map((id, i) => ({
      id,
      votos: conteo[i],
    }));
    resultados.sort((a, b) => b.votos - a.votos);
    // Determinar ganadores (incluyendo empates)
    const n = interaction.options.getInteger("ganadores");
    let corte = n;
    while (
      corte < resultados.length &&
      resultados[corte].votos === resultados[corte - 1].votos
    ) {
      corte++;
    }
    const ganadores = resultados.slice(0, corte);
    let textoResultados = resultados
      .map((r, i) => {
        const votoWord =
          r.votos === 1 ? strings.vote_singular : strings.vote_plural;
        return `${i + 1}. <@${r.id}> - ${r.votos} ${votoWord}`;
      })
      .join("\n");
    let textoGanadores = ganadores
      .map((r, i) => `${i + 1}. <@${r.id}>`)
      .join("\n");
    let texto = strings.results
      .replace("{name}", nombre)
      .replace("{results}", textoResultados)
      .replace("{winners}", textoGanadores);
    data.estado = "cerrado";
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
