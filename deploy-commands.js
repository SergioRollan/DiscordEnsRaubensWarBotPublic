require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    // Borra comandos de guild
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [],
    });
    // Borra comandos globales (opcional, si alguna vez los usaste)
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [],
    });
    console.log("Comandos eliminados.");
  } catch (error) {
    console.error(error);
  }
})();

const commands = [];
const commandFiles = fs.readdirSync("./commands");

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

(async () => {
  try {
    console.log("Actualizando comandos slash...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Comandos registrados.");
  } catch (error) {
    console.error(error);
  }
})();
