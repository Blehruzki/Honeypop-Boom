import { Message, Client, User } from 'discord.js';
import idclass from '../utils/idclass';
export default {
  name: 'botdm',
  requiredRoles: idclass.roleMods(),

  execute(message: Message, args: string[], _client: Client) {
    const requiredRoles = this.requiredRoles;

    const hasRequiredRole = message.member?.roles.cache.some(role =>
      requiredRoles.includes(role.id)
    );

    if (!hasRequiredRole) {
      return message.reply('You do not have permission to use this command.');
    }

    const userMention: User | undefined = message.mentions.users.first();
    if (!userMention) {
      return message.reply('Please mention a valid user.');
    }

    const text = args.slice(1).join(' ');
    if (!text) {
      return message.reply('nice I won\'t DM anyone.');
    }

    userMention.send(text)
      .then(() => message.reply('done'))
      .catch(() => message.reply('nice I won\'t DM anyone.'));
  }
};
