import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import db from "../../utils/db";

export default {
  data: new SlashCommandBuilder()
    .setName("set-delete")
    .setDescription("Enable or disable deleting the spam message on trigger.")
    .addBooleanOption(option =>
      option.setName("enabled")
        .setDescription("true = delete message; false = keep it")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const enabled = interaction.options.getBoolean("enabled", true);
    db.set(`deleteMessage_${interaction.guildId}`, enabled);

    await interaction.reply({
      content: `✅ Delete-on-trigger is now **${enabled ? "ENABLED" : "DISABLED"}**`,
      ephemeral: true,
    });
  },
};
