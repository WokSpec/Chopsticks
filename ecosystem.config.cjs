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
        // PM2 manages the agent runner as a separate process — do not spawn a child here
        DISABLE_AGENT_RUNNER: "true",
        LAVALINK_HOST: process.env.LAVALINK_HOST,
        LAVALINK_PORT: process.env.LAVALINK_PORT,
        LAVALINK_PASSWORD: process.env.LAVALINK_PASSWORD,
        POSTGRES_URL: process.env.POSTGRES_URL,
        DATABASE_URL: process.env.DATABASE_URL,
      }
    },
    {
      name: "chopsticks-agent-runner",
      script: "src/agents/agentRunner.js",
      cwd: "./",
      instances: 1, // Start with 1 instance, can be scaled with `pm2 scale`
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        CHOPSTICKS_AGENT_CHILD: "1", // Crucial for identifying as a child process
        LAVALINK_HOST: process.env.LAVALINK_HOST,
        LAVALINK_PORT: process.env.LAVALINK_PORT,
        LAVALINK_PASSWORD: process.env.LAVALINK_PASSWORD,
        POSTGRES_URL: process.env.POSTGRES_URL,
        DATABASE_URL: process.env.DATABASE_URL,
        AGENT_CONTROL_HOST: process.env.AGENT_CONTROL_HOST,
        AGENT_CONTROL_PORT: process.env.AGENT_CONTROL_PORT,
        AGENT_CONTROL_URL: process.env.AGENT_CONTROL_URL,
      }
    },
    {
      name: "chopsticks-dev-dashboard",
      script: "src/dev-dashboard/server.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        DEV_DASHBOARD_PORT: process.env.DEV_DASHBOARD_PORT || 3001,
        DEV_DASHBOARD_USERNAME: process.env.DEV_DASHBOARD_USERNAME,
        DEV_DASHBOARD_PASSWORD: process.env.DEV_DASHBOARD_PASSWORD,
        POSTGRES_URL: process.env.POSTGRES_URL, // Dashboard needs DB access
        DATABASE_URL: process.env.DATABASE_URL, // Dashboard needs DB access
      }
    }
  ]
};
