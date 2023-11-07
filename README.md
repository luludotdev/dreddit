# 🔥 Dreddit [![Build and Test](https://github.com/luludotdev/dreddit/actions/workflows/ci.yml/badge.svg)](https://github.com/luludotdev/dreddit/actions/workflows/ci.yml)

> Periodically posts reddit images to a Discord webhook

## 🚀 Running in Production

This project uses GitHub Actions to run automated docker builds, you can find them in this repo's [Package Registry](https://github.com/luludotdev/dreddit/packages). A sample Docker Compose file has been provided for you to use as a reference.

### 📝 Configuration

Dreddit is configured with a `config.json` file located in the `config` directory. A [JSON schema](https://github.com/luludotdev/dreddit/blob/master/config/config.schema.json) for IDE integration can be located in the same directory.

Dreddit also requires a Redis database for persistence between restarts. This is configured using environment variables. Refer to `.env.example` for documentation.

Finally, to parse Imgur URLs an Imgur Application Client ID is required. You can generate one in the [Imgur Account Settings](https://imgur.com/account/settings/apps). This is also passed as an environment variable, again refer to `.env.example` for more information.
