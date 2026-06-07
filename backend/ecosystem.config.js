module.exports = {
  apps: [
    {
      name: 'cargogo-backend',
      script: './src/app.ts', // Run the TypeScript entrypoint directly!
      interpreter: 'node',
      node_args: '--import tsx', // Tells Node to use tsx to execute the TypeScript files directly
      instances: 'max',
      exec_mode: 'cluster',
      watch: ["src"],
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
