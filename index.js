require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  SlashCommandBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath);

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`Bot listo como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Hubo un error al ejecutar el comando.",
        ephemeral: true,
      });
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command && command.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

const ROL_AUTORIZADO = "ID_DEL_ROL_AUTORIZADO";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("view")
    .setDescription(
      "Ver a quién ha votado cada persona (solo para el rol autorizado)"
    ),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROL_AUTORIZADO)) {
      return interaction.reply({
        content: "No tienes permiso para usar este comando.",
        ephemeral: true,
      });
    }

    if (!global.election) {
      return interaction.reply({
        content: "No hay elección activa.",
        ephemeral: true,
      });
    }

    const votos = global.election.votos;
    const postulados = global.election.postulados;

    let texto = Object.entries(votos)
      .map(([userId, votos]) => {
        let nombres = votos.map((v) => postulados[v - 1]).join(", ");
        return `<@${userId}>: ${nombres}`;
      })
      .join("\n");

    if (!texto) texto = "Nadie ha votado aún.";

    await interaction.reply({ content: texto, ephemeral: true });
  },
};
