import {
    GuildMember,
    Message,
    TextChannel,
    EmbedBuilder
  } from 'discord.js';
  import idclass from '../utils/idclass';

  export default {
    name: 'unban',
    description: 'Unbans a user from the server.',
    requiredRoles: idclass.roleMods(),
  
    async execute(message: Message, args: string[]) {
      const requiredRoles = this.requiredRoles;
  
      const hasRequiredRole = message.member?.roles.cache.some(role =>
        requiredRoles.includes(role.id)
      );
  
      if (!hasRequiredRole) {
        return message.reply({ content: 'You do not have permission to use this command.' });
      }
  
      const userId = args[0]?.replace(/[<@!>]/g, '');
      if (!userId) {
        return message.reply({ content: 'Please provide a user ID to unban.' });
      }
  
      const reason = args.slice(1).join(' ') || 'No reason provided';
  
      try {
        const bannedUsers = await message.guild?.bans.fetch();
        const bannedUser = bannedUsers?.get(userId);
  
        if (!bannedUser) {
          return message.reply({ content: 'lil bro is likely unbanned.' });
        }
  
        await message.guild?.members.unban(userId, reason);
  
        if (message.channel.isTextBased()) {
          await message.reply({
            content: `${bannedUser.user.tag} has been __**UNBANNED**__.`,
            allowedMentions: { parse: [] }
          });
        }
  
        const logChannel = message.guild?.channels.cache.get(idclass.logChannel());
        if (logChannel?.isTextBased()) {
          await logChannel.send({
            content: `${bannedUser.user.tag} has been __**UNBANNED**__ by <@${message.author.id}> for: ${reason}`,
            allowedMentions: { parse: [] }
          });
        }
      } catch (error) {
        console.error(error);
        await message.reply({ content: 'I was unable to unban the user.' });
      }
    }
  };
  