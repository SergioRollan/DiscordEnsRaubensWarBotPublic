const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("create")
    .setDescription("Crea una nueva elección para que la gente se postule.")
    .setDescriptionLocalization(
      "en-US",
      "Create a new voting for people to apply."
    )
    .setDescriptionLocalization(
      "fr",
      "Créez une nouvelle élection pour que les gens puissent se présenter."
    )
    .addStringOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de la elección")
        .setDescriptionLocalization("en-US", "Name of the voting")
        .setDescriptionLocalization("fr", "Nom de l'élection")
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
    if (!interaction.client.electionData) interaction.client.electionData = {};
    if (!interaction.client.electionData[interaction.guildId])
      interaction.client.electionData[interaction.guildId] = {};
    if (interaction.client.electionData[interaction.guildId][nombre]) {
      return interaction.reply({
        content: strings.election_already_exists,
        ephemeral: true,
      });
    }
    // Crear la elección
    interaction.client.electionData[interaction.guildId][nombre] = {
      postulados: [],
      estado: "postulacion",
      pollMessageId: null,
    };
    const pollMessage = await interaction.reply({
      content: strings.create_poll
        .replace("{name}", nombre)
        .replace("{candidates}", strings.no_candidates),
      fetchReply: true,
    });
    await pollMessage.react("✅");
    interaction.client.electionData[interaction.guildId][nombre].pollMessageId =
      pollMessage.id;
    // Listener para reacciones
    const filter = (reaction, user) =>
      reaction.emoji.name === "✅" && !user.bot;
    const collector = pollMessage.createReactionCollector({
      filter,
      dispose: true,
    });
    collector.on("collect", async (reaction, user) => {
      const data = interaction.client.electionData[interaction.guildId][nombre];
      if (!data.postulados.includes(user.id)) {
        data.postulados.push(user.id);
        await actualizarMensaje();
      }
    });
    collector.on("remove", async (reaction, user) => {
      const data = interaction.client.electionData[interaction.guildId][nombre];
      data.postulados = data.postulados.filter((id) => id !== user.id);
      await actualizarMensaje();
    });
    async function actualizarMensaje() {
      const data = interaction.client.electionData[interaction.guildId][nombre];
      const postulados = data.postulados;
      let candidatesText = "";
      if (postulados.length === 0) {
        candidatesText = strings.no_candidates;
      } else if (postulados.length === 1) {
        candidatesText = strings.one_candidate;
      } else {
        candidatesText = strings.many_candidates.replace(
          "{count}",
          postulados.length
        );
      }
      let texto = strings.create_poll
        .replace("{name}", nombre)
        .replace(
          "{candidates}",
          postulados.length === 0
            ? candidatesText
            : postulados.map((id, i) => `${i + 1}. <@${id}>`).join("\n") +
                `\n${candidatesText}`
        );
      await pollMessage.edit({ content: texto });
    }
  },
};
