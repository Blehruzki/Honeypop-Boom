import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import db from "../../utils/db";
import { ExtendedClient } from "../../index"; // optional if you need client

export default {
  data: new SlashCommandBuilder()
    .setName("show-config")
    .setDescription("Show the current honeypot configuration."),

  async execute(interaction: ChatInputCommandInteraction, client?: ExtendedClient) {
    const guildId = interaction.guildId!;
    
    // use await because db.get() is async
    const honeypot = (await db.get(`honeypot_${guildId}`)) || "not set";
    const log = (await db.get(`log_${guildId}`)) || "not set";
    const deleteMessage = (await db.get(`deleteMessage_${guildId}`)) ?? true;

    const lines = [
      `**Honeypot:** ${honeypot !== "not set" ? `<#${honeypot}>` : "not set"}`,
      `**Log:** ${log !== "not set" ? `<#${log}>` : "not set"}`,
      `**Delete on trigger:** ${deleteMessage ? "enabled" : "disabled"}`,
    ];

    await interaction.reply({ content: lines.join("\n"), ephemeral: true });
  },
};
