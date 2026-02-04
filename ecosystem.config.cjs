module.exports = {
  apps: [
    {
      name: "control",
      script: "src/control/controlServer.js",
      env_file: ".env"
    },

    {
      name: "worker-1",
      script: "src/workers/workers.js",
      env_file: ".env",
      env: {
        WORKER_TOKEN: "MTQ2ODE5NTE0MjQ2Nzk4MTM5NQ.GjXW9j.8wSAXQhEutNCEm2Dxefr-Da3f5o8UvtNjGtCSc",
        CONTROL_URL: "ws://127.0.0.1:3001"
      }
    },

    {
      name: "worker-2",
      script: "src/workers/workers.js",
      env_file: ".env",
      env: {
        WORKER_TOKEN: "MTQ2ODE5ODA4NDA1OTIwNTcyNA.GjKiFW.6DZMG8_sUo72AZ3yO8DMW0RRQZ32sUPAtd7G5U",
        CONTROL_URL: "ws://127.0.0.1:3001"
      }
    },

    {
      name: "worker-3",
      script: "src/workers/workers.js",
      env_file: ".env",
      env: {
        WORKER_TOKEN: "MTQ2ODE5NzU2MjYzNTkxNTQyNw.GfjT4j.GRrGVeN1lBc7sZKyQy-NPdYTSMe30KFhiTne-A",
        CONTROL_URL: "ws://127.0.0.1:3001"
      }
    },

    {
      name: "worker-4",
      script: "src/workers/workers.js",
      env_file: ".env",
      env: {
        WORKER_TOKEN: "MTQ2ODE5ODMwNDQ3MDAwNzgyOQ.GyZX4p.xYJDrBvEvXb-fuxP5o78uECqUWUPJFmSBhF3S4",
        CONTROL_URL: "ws://127.0.0.1:3001"
      }
    },

    {
      name: "worker-5",
      script: "src/workers/workers.js",
      env_file: ".env",
      env: {
        WORKER_TOKEN: "MTQ2ODE5ODcxNDM2MjQzMzYwNg.Gd5sED.OtKWuNPm3H5Pv9o7ce8Fd7v3HEVC0N43LlP3Gg",
        CONTROL_URL: "ws://127.0.0.1:3001"
      }
    },

    {
      name: "lavalink",
      script: "java",
      args: "-jar lavalink/Lavalink.jar --spring.config.location=file:./lavalink/application.yml",
      interpreter: "none"
    }
  ]
};
