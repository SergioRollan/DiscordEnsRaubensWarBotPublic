require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

const commands = [];
const commandFiles = fs.readdirSync("./commands");

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

(async () => {
  try {
    const guildId = process.env.GUILD_ID;
    if (guildId) {
      console.log(`Updating guild slash commands for GUILD_ID=${guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
      );
      console.log("Guild commands registered.");
    } else {
      console.log("Updating global slash commands (may take up to 1 hour)...");
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
      });
      console.log("Global commands registered.");
    }
  } catch (error) {
    console.error(error);
  }
})();
