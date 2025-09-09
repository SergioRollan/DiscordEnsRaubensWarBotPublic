const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

function hasAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

function hasPrivRole(interaction) {
  const cfgRole = interaction.client.config.roles?.[interaction.guildId];
  if (!cfgRole) return false;
  return interaction.member.roles.cache.some((r) => r.name === cfgRole);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show bot help"),
  async execute(interaction) {
    const isAdmin = hasAdmin(interaction);
    const hasRole = hasPrivRole(interaction);

    const lines = [];
    lines.push("## General usage:");
    lines.push(
      "This bot manages per-channel war registrations by hour. Hours are 00..23."
    );
    lines.push(
      "There will be a single summary message per channel (unless toggled off)."
    );
    lines.push("");
    lines.push("## Commands:");
    lines.push(
      "- **/warreg** entries:<c20 mb21 csub22 ct23> Register multiple entries in one go."
    );
    lines.push(
      "- **/drop** hours:<20 21 etc> Remove your registrations for given hours."
    );
    lines.push(
      "- **/can** hours:<20 21 etc> Register those hours as confirmed (c)."
    );
    lines.push(
      "- **/maybe** hours:<20 21 etc> Register those hours as maybe (mb)."
    );
    lines.push(
      "- **/cansub** hours:<20 21 etc> Register those hours as confirming if no one else does (csub)."
    );
    lines.push(
      "- **/cant** hours:<20 21 etc> Register those hours as can't (ct)."
    );

    if (isAdmin || hasRole) {
      lines.push(
        "- **/clear** Clear all registrations in the current channel."
      );
      lines.push(
        "- **/staymessage** value:<true|false> Toggle editing the same summary message (true) or posting a new one every time (false)."
      );
      lines.push(
        "- **/startwithtime** hour:<00..23> Set the hour at which the summary starts."
      );
    }

    if (isAdmin) {
      lines.push(
        "- **/configrole** role_name:<name> Set role name that can use /clear and other privileged commands."
      );
    }
    lines.push("");
    lines.push("## Formatting:");
    lines.push(
      "- Each hour lists users grouped by emoji: c (✅), csub (❗), mb (❓), ct (❌)."
    );
    lines.push(
      "- Within the same emoji, users are shown in chronological order (left→right)."
    );
    lines.push(
      "- If c + csub reaches at least 3 the hours shows how many people are needed to reach 6."
    );
    lines.push("");

    const text = lines.join("\n");
    await interaction.reply({ content: text, ephemeral: true });
  },
};
