module.exports = {
  apps: [
    {
      name: "control",
      script: "src/control/controlServer.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
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
        CLIENT_ID: process.env.CLIENT_ID
      }
    },
    {
      name: "worker-01",
      script: "src/workers/workers.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        WORKER_TOKEN: process.env.WORKER_TOKEN,
        CONTROL_URL: "ws://localhost:3001",
        LAVALINK_HOST: "localhost",
        LAVALINK_PORT: "2333",
        LAVALINK_PASSWORD: "youshallnotpass"
      }
    },
    {
      name: "worker-02",
      script: "src/workers/workers.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        WORKER_TOKEN: process.env.WORKER_TOKEN,
        CONTROL_URL: "ws://localhost:3001",
        LAVALINK_HOST: "localhost",
        LAVALINK_PORT: "2333",
        LAVALINK_PASSWORD: "youshallnotpass"
      }
    },
    {
      name: "worker-03",
      script: "src/workers/workers.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        WORKER_TOKEN: process.env.WORKER_TOKEN,
        CONTROL_URL: "ws://localhost:3001",
        LAVALINK_HOST: "localhost",
        LAVALINK_PORT: "2333",
        LAVALINK_PASSWORD: "youshallnotpass"
      }
    }
  ]
};