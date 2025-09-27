import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType } from "discord.js";
import db from "../../utils/db";

export default {
  data: new SlashCommandBuilder()
    .setName("set-log")
    .setDescription("Set the log channel for honeypot actions.")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Select the log channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel", true);
    db.set(`log_${interaction.guildId}`, channel.id);

    await interaction.reply({
      content: `✅ Log channel set to <#${channel.id}>`,
      ephemeral: true,
    });
  },
};
