# 🔥 Dreddit
_Periodically posts reddit images to a Discord webhook_

## 💾 Installation
It is recommended to run this with [Docker](https://www.docker.com/get-started). You can also run with Node.js >8.x but it is not recommended for production use.  
If using Docker, you can either build the image yourself from this repo, or pull the `lolpants/dreddit` image.

## 🚀 Usage (Docker)
### Compose
A Docker Compose file has been provided with this repo. It can be used directly, but is intended to be used as a base for others to build upon.

### Manual (Not Recommended)
1. Pull the image (`lolpants/dreddit`)
2. Start a redis container  
  `docker run --name redis redis:alpine`
3. Start the container with a link to the redis container  
  `docker run --name dreddit --link redis:redis -v config.json:/usr/app/config/config.json lolpants/dreddit`

## 🔧 Usage (Node.js)
1. Clone the repo
2. Install dependencies with `yarn`
3. Compile the TypeScript source with `yarn build`
4. Run with `node .`
  Be sure to set the relevant environment variables.

## 📝 Configuration
### Environment Variables
When running with Node.js you must set these explicitly.  
You can use a `.env` file to set these.

In a Docker Container you can set the Redis config manually, but you do not need to if using internal networking. The default settings connect to `redis://redis:6379/0`.

```env
# Node ENV, should be production or development
NODE_ENV=

# Redis Details used to connect to the Redis Instance
REDIS_HOST=
REDIS_PORT=
REDIS_DB=
REDIS_PASSWORD=
```

### Config JSON
The bulk of the configuration is done with the `config.json` file. A schema has been provided in `/config/config.schema.json`.
