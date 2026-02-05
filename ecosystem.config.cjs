// ecosystem.config.cjs
module.exports = {
  apps: [
    /* ===================== GATEWAY ===================== */
    {
      name: "gateway",
      script: "src/index.js",
      node_args: "--enable-source-maps",
      env_file: ".env",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },

    /* ===================== CONTROL ===================== */
    {
      name: "control",
      script: "src/control/controlServer.js",
      node_args: "--enable-source-maps",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },

    /* ===================== WORKERS ===================== */
    {
      name: "worker",
      script: "src/workers/workers.js",
      instances: 5,
      exec_mode: "fork",
      node_args: "--enable-source-maps",
      env_file: ".env",
      env: {
        CONTROL_URL: "ws://127.0.0.1:3001"
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },

    /* ===================== LAVALINK ===================== */
    {
      name: "lavalink",
      script: "java",
      args: [
        "-Dspring.config.location=./lavalink/application.yml",
        "-jar",
        "lavalink/Lavalink.jar"
      ],
      interpreter: "none",
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000
    }
  ]
};
