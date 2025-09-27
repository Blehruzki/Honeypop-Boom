import { Message, PermissionsBitField } from "discord.js";
import { ExtendedClient } from "../utils/ExtendedClient";
import db from "../utils/db";
import idclass from "../utils/idclass";

const prefixes = ["?", "."];

export default {
  name: "messageCreate",
  once: false,
  async execute(message: Message, client: ExtendedClient) {
    // --- Honeypot logic ---
    if (message.inGuild() && !message.author.bot && !message.system) {
      const guildId = message.guildId!;

      // ✅ Await DB calls and fallback to idclass defaults
      const honeypotChannelId =
        (await db.get<string>(`honeypot_${guildId}`)) ?? idclass.channelHoneypot();
      const logChannelId =
        (await db.get<string>(`log_${guildId}`)) ?? idclass.logChannel();
      const deleteMessage = (await db.get<boolean>(`deleteMessage_${guildId}`)) ?? true;

      if (honeypotChannelId && message.channel.id === honeypotChannelId) {
        const member = message.member;
        if (member) {
          // ✅ Skip if whitelisted
          if (member.roles.cache.some((r) => idclass.roleMods().includes(r.id))) {
            return;
          }

          const me = message.guild!.members.me!;
          const snapshot = message.content ?? "";

          // 1) Delete message if enabled
          if (
            deleteMessage &&
            me.permissionsIn(message.channel).has(PermissionsBitField.Flags.ManageMessages)
          ) {
            await message.delete().catch(() => null);
          }

          // 2) Ban user if possible
          if (
           me.permissions.has(PermissionsBitField.Flags.BanMembers) &&
          me.roles.highest.comparePositionTo(member.roles.highest) > 0
          ) {
          await message.guild!.members
          .ban(message.author.id, {
          reason: `Posted in honeypot channel (${message.channel.id})`,
           deleteMessageDays: 1, // ✅ Remove last 1 day of messages
          })
          .catch(() => null);
       }

          // 3) Log to log channel
          if (logChannelId) {
            const logChannel = await message.guild!.channels.fetch(logChannelId).catch(() => null);
            if (logChannel?.isTextBased()) {
              await logChannel.send({
                embeds: [
                  {
                    title: "🚨 Honeypot Triggered",
                    description: `User **${message.author.tag}** posted in honeypot <#${honeypotChannelId}>`,
                    fields: [
                      { name: "User ID", value: message.author.id },
                      { name: "Message", value: snapshot || "—" },
                    ],
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
            }
          }
        }
      }
    }

    // --- Prefix command logic ---
    const prefix = prefixes.find((p) => message.content.startsWith(p));
    if (!prefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()!.toLowerCase();
    const command = client.prefixCommands.get(commandName);

    if (command) {
      // ✅ Owner bypass + role check
      if (
        message.author.id !== idclass.ownershipID() &&
        !message.member?.roles.cache.some((r) => idclass.roleMods().includes(r.id))
      ) {
        return message.reply({
          content: "You don't have permission to use this command.",
          allowedMentions: { parse: [] },
        });
      }

      try {
        await command.execute(message, args, client);
      } catch (error) {
        console.error(`Error in prefix command ${commandName}:`, error);
        message.reply({
          content: process.env.ERR,
          allowedMentions: { parse: [] },
        });
      }
    }
  },
};
