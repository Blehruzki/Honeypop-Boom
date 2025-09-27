import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType } from "discord.js";
import db from "../../utils/db";

export default {
  data: new SlashCommandBuilder()
    .setName("set-honeypot")
    .setDescription("Set the honeypot text channel (users posting here get banned).")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Select the honeypot channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel", true);
    db.set(`honeypot_${interaction.guildId}`, channel.id);

    await interaction.reply({
      content: `✅ Honeypot channel set to <#${channel.id}>`,
      ephemeral: true,
    });
  },
};
