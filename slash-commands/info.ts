import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, version as discordJsVersion } from 'discord.js';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getGitInfo() {
    try {
        const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
        const { stdout: lastCommit } = await execAsync('git log -1 --format=%s');
        const { stdout: commitHash } = await execAsync('git rev-parse --short HEAD');
        return {
            branch: branch.trim(),
            lastCommit: lastCommit.trim(),
            commitHash: commitHash.trim()
        };
    } catch (error) {
        return {
            branch: 'Unknown',
            lastCommit: 'Unknown',
            commitHash: 'Unknown'
        };
    }
}

function getCpuUsage(): Promise<string> {
    return new Promise((resolve) => {
        const start = os.cpus();

        setTimeout(() => {
            const end = os.cpus();
            let idleDiff = 0;
            let totalDiff = 0;

            for (let i = 0; i < start.length; i++) {
                const startCpu = start[i].times;
                const endCpu = end[i].times;

                const idle = endCpu.idle - startCpu.idle;
                const total = Object.keys(endCpu).reduce(
                    (acc, key) => acc + (endCpu[key as keyof typeof endCpu] - startCpu[key as keyof typeof startCpu]),
                    0
                );

                idleDiff += idle;
                totalDiff += total;
            }

            const usage = 100 - Math.round((idleDiff / totalDiff) * 100);
            resolve(`${usage}%`);
        }, 100);
    });
}

function formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}

function formatUptime(uptime: number): string {
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return parts.join(' ');
}

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays detailed bot information and system stats.'),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const bot = interaction.client;

        // System stats
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = `${formatBytes(usedMem)} / ${formatBytes(totalMem)}`;
        const cpuUsage = await getCpuUsage();
        
        // Git info
        const gitInfo = await getGitInfo();

        const mainEmbed = new EmbedBuilder()
            .setTitle('DeltaBotz Information')
            .setDescription('A powerful Discord bot built with TypeScript')
            .addFields(
                { 
                    name: 'Bot Status',
                    value: [
                        `**Uptime:** ${formatUptime(bot.uptime!)}`,
                        `**Latency:** ${Math.round(bot.ws.ping)}ms`,
                        `**Memory:** ${memoryUsage}`,
                        `**CPU Usage:** ${cpuUsage}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'System Info',
                    value: [
                        `**OS:** ${os.platform()} ${os.release()}`,
                        `**Architecture:** ${os.arch()}`,
                        `**CPU Cores:** ${os.cpus().length}`,
                        `**Node.js:** ${process.version}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Technical Stack',
                    value: [
                        `**Language:** TypeScript`,
                        `**Runtime:** Node.js ${process.version}`,
                        `**Discord.js:** v${discordJsVersion}`,
                        `**Database:** better-sqlite3`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Repository Info',
                    value: [
                        `**Branch:** ${gitInfo.branch}`,
                        `**Latest Commit:** ${gitInfo.lastCommit}`,
                        `**Commit Hash:** ${gitInfo.commitHash}`,
                        `**Repository:** [GitHub](https://github.com/Blehruzki/Honeypop-Boom)`
                    ].join('\n')
                },
                {
                    name: 'Credits',
                    value: [
                        '**Developer:** Delta Team',
                        '**Hosted On:** CloudPanel Server',
                        '**Support:** [Star us on GitHub!](https://github.com/Blehruzki/Honeypop-Boom)'
                    ].join('\n')
                }
            )
            .setColor('#ff9500')
            .setTimestamp()
            .setFooter({ text: 'Use /help to see available commands' });

        await interaction.editReply({ embeds: [mainEmbed] });
    },
};
