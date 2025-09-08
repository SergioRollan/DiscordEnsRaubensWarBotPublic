require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Command loader (same structure)
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath);
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// In-memory state per channel: registrations[channelId][hour][userId] = status
client.registrations = Object.create(null);
// Channel summary message ids: summaryMessages[channelId] = messageId
client.summaryMessages = Object.create(null);

// Config per guild for clear role name, persisted in config.json
client.config = { roles: {} };
try {
  const raw = fs.readFileSync(path.join(__dirname, "config.json"), "utf8");
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === "object") {
    client.config = { roles: {}, ...parsed };
    if (!client.config.roles) client.config.roles = {};
  }
} catch {}

client.once("ready", () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const replied = interaction.replied || interaction.deferred;
    if (!replied) {
      await interaction.reply({
        content: "An error occurred.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
