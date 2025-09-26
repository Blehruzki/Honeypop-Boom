require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ApplicationCommandOptionType,
  ChannelType,
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

// ---- Storage (per-guild config) ----
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function loadConfig() {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    console.error('config.json is corrupt; starting fresh.');
    return {};
  }
}
function saveConfig(cfg) {
  ensureDataDir();
  // simple atomic-ish save
  const tmp = CONFIG_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2));
  fs.renameSync(tmp, CONFIG_PATH);
}

let CONFIG = loadConfig(); // { [guildId]: { honeypotChannelId, logChannelId, whitelistRoleIds: [] } }

function getGuildConfig(gid) {
  if (!CONFIG[gid]) {
    CONFIG[gid] = { honeypotChannelId: null, logChannelId: null, whitelistRoleIds: [] };
  }
  return CONFIG[gid];
}

// ---- Client ----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,   // needed for role checks
    GatewayIntentBits.MessageContent, // optional but useful
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// ---- Commands (guild-scoped, auto-registered) ----
const MANAGE_GUILD = PermissionsBitField.Flags.ManageGuild.toString();

const COMMANDS = [
  {
    name: 'set-honeypot',
    description: 'Set the honeypot text channel (users posting here get banned).',
    default_member_permissions: MANAGE_GUILD,
    dm_permission: false,
    options: [
      {
        name: 'channel',
        description: 'Select your honeypot text channel',
        type: ApplicationCommandOptionType.Channel,
        required: true,
        channel_types: [ChannelType.GuildText],
      },
    ],
  },
  {
    name: 'set-log',
    description: 'Set the log text channel for honeypot actions.',
    default_member_permissions: MANAGE_GUILD,
    dm_permission: false,
    options: [
      {
        name: 'channel',
        description: 'Select your log text channel',
        type: ApplicationCommandOptionType.Channel,
        required: true,
        channel_types: [ChannelType.GuildText],
      },
    ],
  },
  {
    name: 'whitelist-add',
    description: 'Add a role to the whitelist (members with this role will NOT be banned).',
    default_member_permissions: MANAGE_GUILD,
    dm_permission: false,
    options: [
      {
        name: 'role',
        description: 'Role to whitelist',
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
    ],
  },
  {
    name: 'whitelist-remove',
    description: 'Remove a role from the whitelist.',
    default_member_permissions: MANAGE_GUILD,
    dm_permission: false,
    options: [
      {
        name: 'role',
        description: 'Role to remove',
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
    ],
  },
  {
    name: 'show-config',
    description: 'Show current honeypot configuration.',
    default_member_permissions: MANAGE_GUILD,
    dm_permission: false,
  },
];

async function registerGuildCommands(guild) {
  try {
    await guild.commands.set(COMMANDS);
    console.log(`Registered commands in ${guild.name} (${guild.id})`);
  } catch (e) {
    console.error(`Failed to register commands in ${guild.id}`, e);
  }
}

client.on('ready', async () => {
  console.log(`✅ Ready as ${client.user.tag}`);
  // Register commands in all current guilds
  for (const [, guild] of client.guilds.cache) {
    await registerGuildCommands(guild);
  }
});

client.on('guildCreate', async (guild) => {
  // Bot added to a new server → register commands there
  await registerGuildCommands(guild);
});

// ---- Helpers ----
function isWhitelisted(member, guildCfg) {
  if (!member) return false;
  // Exempt admins & guild managers
  if (member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    return true;
  }
  // Exempt whitelisted roles
  if (!guildCfg?.whitelistRoleIds?.length) return false;
  return guildCfg.whitelistRoleIds.some((rid) => member.roles.cache.has(rid));
}

async function auditLog(guild, payload) {
  const { userTag, userId, channelName, channelId, action, reason } = payload;
  try {
    const cfg = getGuildConfig(guild.id);
    if (!cfg.logChannelId) return;
    const ch = await guild.channels.fetch(cfg.logChannelId).catch(() => null);
    if (!ch || !ch.isTextBased()) return;
    await ch.send({
      embeds: [
        {
          title: 'Honeypot',
          fields: [
            { name: 'Action', value: action ?? '—', inline: true },
            { name: 'User', value: `${userTag} (${userId})`, inline: true },
            { name: 'Channel', value: `${channelName} (${channelId})`, inline: true },
            { name: 'Reason', value: reason ?? '—' },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (e) {
    console.error('Failed to log audit event', e);
  }
}

// ---- Slash command handling ----
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

  const guildId = interaction.guildId;
  const cfg = getGuildConfig(guildId);

  try {
    switch (interaction.commandName) {
      case 'set-honeypot': {
        const ch = interaction.options.getChannel('channel', true);
        cfg.honeypotChannelId = ch.id;
        CONFIG[guildId] = cfg;
        saveConfig(CONFIG);
        await interaction.reply({ content: `✅ Honeypot channel set to <#${ch.id}>`, ephemeral: true });
        break;
      }
      case 'set-log': {
        const ch = interaction.options.getChannel('channel', true);
        cfg.logChannelId = ch.id;
        CONFIG[guildId] = cfg;
        saveConfig(CONFIG);
        await interaction.reply({ content: `✅ Log channel set to <#${ch.id}>`, ephemeral: true });
        break;
      }
      case 'whitelist-add': {
        const role = interaction.options.getRole('role', true);
        if (!cfg.whitelistRoleIds.includes(role.id)) cfg.whitelistRoleIds.push(role.id);
        saveConfig(CONFIG);
        await interaction.reply({ content: `✅ Whitelisted role: <@&${role.id}>`, ephemeral: true });
        break;
      }
      case 'whitelist-remove': {
        const role = interaction.options.getRole('role', true);
        cfg.whitelistRoleIds = (cfg.whitelistRoleIds || []).filter((r) => r !== role.id);
        saveConfig(CONFIG);
        await interaction.reply({ content: `✅ Removed from whitelist: <@&${role.id}>`, ephemeral: true });
        break;
      }
      case 'show-config': {
        const lines = [
          `**Honeypot:** ${cfg.honeypotChannelId ? `<#${cfg.honeypotChannelId}>` : 'not set'}`,
          `**Log:** ${cfg.logChannelId ? `<#${cfg.logChannelId}>` : 'not set'}`,
          `**Whitelist roles:** ${
            cfg.whitelistRoleIds?.length
              ? cfg.whitelistRoleIds.map((r) => `<@&${r}>`).join(', ')
              : 'none'
          }`,
        ];
        await interaction.reply({ content: lines.join('\n'), ephemeral: true });
        break;
      }
    }
  } catch (e) {
    console.error('Slash command error:', e);
    if (!interaction.replied) {
      await interaction.reply({ content: `❌ Error: ${String(e)}`, ephemeral: true });
    }
  }
});

// ---- Core honeypot behavior ----
client.on('messageCreate', async (message) => {
  try {
    if (!message.inGuild() || message.author.bot || message.system) return;

    const cfg = CONFIG[message.guild.id];
    if (!cfg?.honeypotChannelId || message.channel.id !== cfg.honeypotChannelId) return;

    const member = message.member; // present on messageCreate with GuildMembers intent
    if (isWhitelisted(member, cfg)) {
      await auditLog(message.guild, {
        userTag: message.author.tag,
        userId: message.author.id,
        channelName: message.channel.name,
        channelId: message.channel.id,
        action: 'IGNORED (whitelisted)',
        reason: 'User has exempt permissions/role',
      });
      return;
    }

    const me = message.guild.members.me;
    if (!me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      await auditLog(message.guild, {
        userTag: message.author.tag,
        userId: message.author.id,
        channelName: message.channel.name,
        channelId: message.channel.id,
        action: 'FAILED',
        reason: 'Bot lacks Ban Members permission',
      });
      return;
    }

    // Role hierarchy check: bot must be above the target member
    const canBan = member && me.roles.highest.comparePositionTo(member.roles.highest) > 0;
    if (!canBan) {
      await auditLog(message.guild, {
        userTag: message.author.tag,
        userId: message.author.id,
        channelName: message.channel.name,
        channelId: message.channel.id,
        action: 'FAILED',
        reason: 'Bot role is not high enough to ban this user',
      });
      return;
    }

    // Ban user
    const reason = `Posted in honeypot channel (${message.channel.id})`;
    await message.guild.members.ban(message.author.id, { reason });
    await auditLog(message.guild, {
      userTag: message.author.tag,
      userId: message.author.id,
      channelName: message.channel.name,
      channelId: message.channel.id,
      action: 'BANNED',
      reason,
    });
  } catch (err) {
    console.error('messageCreate handler error:', err);
    try {
      await auditLog(message.guild, {
        userTag: message?.author?.tag ?? 'unknown',
        userId: message?.author?.id ?? 'unknown',
        channelName: message?.channel?.name ?? 'unknown',
        channelId: message?.channel?.id ?? 'unknown',
        action: 'FAILED',
        reason: String(err),
      });
    } catch {}
  }
});

client.login(TOKEN);