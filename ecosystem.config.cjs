module.exports = {
  apps: [
    {
      name: "logistic-client",
      cwd: __dirname,
      script: "npx",
      args: "serve -s dist -l 3000",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
