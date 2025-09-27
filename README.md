# Honeypop-Boom
Simple bot for trapping and banning discord spammers

# Commands
**/set-honeypot #channel** - set the channel you want to use as honeypot  
**/set-log #channel** - set the channel you want to use for logs  
**/show-config** - show current honeypot configuration  
**/whitelist-add** - add a role to the whitelist (members with this role will NOT be banned)  
**/whitelist-remove** - remove a role from the whitelist.  
**/set-delete** - enables deleting messages in the honeypot channel *(enabled by default)*

# (WIP) How to set up
## Prerequisites:
- Your own `.env` with your own bot token
- Your own host and docker (or just leave your PC on always)
- Node.js LTS installed (if running the bot locally)

## Create your own discord bot
1. Go to https://discord.com/developers/applications and **Create an application**
2. Under Bot → Add Bot → confirm.

3. Copy the Bot Token, paste it in a notepad file and name it `.env` (delete the .txt extension when saving it)

4. Under **Privileged Gateway Intents** enable `Message Content Intent` and `Server Members Intent`

5. Under OAuth2 → URL Generator select:
    - Scopes: 
        - bot
        - applications.commands

    - Bot Permissions:     
        - View channels
        - Ban members
        - Manage messages
        - Send messages
        - Read messages history
    
    Copy the URL generated at the bottom and open it in a browser. It should beam the bot invitation to your discord client and ask you to give all the perms it needs.

    *Note: Make sure the bot role is above those you want to ban (otherwise it won't be able to)*

## Run it locally
1. Pull this repo to your local computer

2. Put your `.env` in the same folder where all the files are in.

3. Open a terminal in the folder and run `node index.js`

## Disclaimer
This is just a personal, fun experiment, and it shouldn't be taken as a serious project. I'm no dev in any way, and I'm helping myself with AI for the coding. I know this has huge room for improvement, but as I learn at my own pace, I'll do the necessary optimizations to make it look more polished. 
