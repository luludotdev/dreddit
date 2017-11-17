# Discord Memebot ![](https://gitlab.com/lolPants/discord-memebot/badges/master/build.svg)
_me\_irl style bot but for Discord. Uses Webhooks_  
Built by [Jack Baron](https://www.jackbaron.com)

## Installation
### Prerequisites
* Docker

### Setup
1. Make sure Docker Daemon is running with `docker ps`
2. Pull the docker image:  
`docker pull registry.gitlab.com/lolpants/discord-memebot:latest`
3. Create a Discord Webhook and note down the URL.
4. Create `memebot.env` and fill in your details *(see below)*.
5. Start the bot using:  
`docker run --restart on-failure --name memebot -d --env-file memebot.env registry.gitlab.com/lolpants/discord-memebot:master`

## `memebot.env`
To configure your bot, make a new file named `memebot.env` and fill it out as follows:
```env
# Subreddit to monitor
# You can monitor multiple by separating them with |
SUBREDDIT=me_irl

# Remove this if you don't want to see NSFW posts
ALLOW_NSFW=true

# List of Webhook URLS
# Add multiple by separating them with |
HOOK_URLS=<HOOK URL>|<ANOTHER HOOK URL>
```
