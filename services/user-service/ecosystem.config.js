module.exports = {
  apps: [
    {
      name: 'user-service', // Change this name accordingly for each service
      script: './src/index.js', // Path to the main script
      instances: 1,
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
