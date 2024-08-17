module.exports = {
    apps: [
      {
        name: 'product-service',
        script: './src/index.js',
        instances: 5,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'development',
        },
        env_production: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  