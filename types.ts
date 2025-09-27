import { 
    ClientEvents, 
    CommandInteraction, 
    ButtonInteraction, 
    SlashCommandBuilder, 
    ChatInputCommandInteraction 
} from 'discord.js';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    buttonHandler?: (interaction: ButtonInteraction) => Promise<void>;
}

export interface Event {
    name: keyof ClientEvents;
    execute: (...args: any[]) => Promise<void>;
    once?: boolean;
}
