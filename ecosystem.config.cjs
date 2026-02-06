// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "chopsticks",
      script: "src/index.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        DISCORD_TOKEN: process.env.DISCORD_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,
        DEV_GUILD_ID: process.env.DEV_GUILD_ID,
        PROD_GUILD_ID: process.env.PROD_GUILD_ID,
        LAVALINK_HOST: process.env.LAVALINK_HOST,
        LAVALINK_PORT: process.env.LAVALINK_PORT,
        LAVALINK_PASSWORD: process.env.LAVALINK_PASSWORD,
      },
    },
  ],
};
