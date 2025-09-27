import { Client, Events, ActivityType } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        client.user.setActivity('ARMSX2 Server', {
            type: ActivityType.Watching
        });
    }
};
