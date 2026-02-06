// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "bot",
      script: "src/index.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",

        DISCORD_TOKEN: process.env.DISCORD_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,

        // optional: used by deploy scripts only, safe to pass through
        DEV_GUILD_ID: process.env.DEV_GUILD_ID,
        GUILD_ID: process.env.GUILD_ID,

        // Lavalink docker node
        LAVALINK_HOST: process.env.LAVALINK_HOST || "localhost",
        LAVALINK_PORT: process.env.LAVALINK_PORT || "2333",
        LAVALINK_PASSWORD: process.env.LAVALINK_PASSWORD || "youshallnotpass"
      }
    }
  ]
};
