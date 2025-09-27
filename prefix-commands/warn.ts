import { Message, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import idclass from '../utils/idclass';
const roles = idclass

export default {
  name: 'warn',
  description: 'Issues a warning to a user.',
  requiredRoles: idclass.roleMods(),
  protectedRoles: [
    ...roles.roleMods(),
],


  async execute(message: Message, args: string[]) {
    const requiredRoles: string[] = this.requiredRoles;
    const protectedRoles: string[] = this.protectedRoles;

    const member = message.member;
    if (!member) return;

    const hasRequiredRole = member.roles.cache.some(role =>
      requiredRoles.includes(role.id)
    );

    if (!hasRequiredRole) {
      return message.reply({
        content: 'You do not have permission to use this command.',
        allowedMentions: { parse: [] }
      });
    }

    const user = message.mentions.members?.first();
    const reason = args.slice(1).join(' ') || 'No reason provided';

    if (!user) {
      return message.reply({
        content: 'Please mention a user to warn.',
        allowedMentions: { parse: [] }
      });
    }

    const hasProtectedRole = user.roles.cache.some(role =>
      protectedRoles.includes(role.id)
    );

    if (hasProtectedRole) {
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setDescription('You cannot warn trusted/mods <:DogHush:1331679185072029798>');

      return message.reply({
        embeds: [embed],
        allowedMentions: { parse: [] }
      });
    }

    await message.reply({
      content: `<@${user.id}> has been **__WARNED__**`,
      allowedMentions: { parse: [] }
    });

    const logChannel = message.guild?.channels.cache.get(roles.logChannel()) as TextChannel;
    if (logChannel) {
      await logChannel.send({
        content: `<@${user.id}> has been **__WARNED__** by <@${message.author.id}> for: **${reason}**`,
        allowedMentions: { parse: [] }
      });
    }

    user.send(`You have been **__WARNED__** in **${message.guild?.name}** for: **${reason}**`)
      .catch(async () => {
        if (logChannel) {
          await logChannel.send({
            content: `Could not send DM to <@${user.id}> about the warning.`,
            allowedMentions: { parse: [] }
          });
        }
      });
  },
};
