module.exports = {
  apps: [
    {
      name: 'iictms-api-test',
      cwd: './backend',
      script: 'node',
      args: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'iictms-web-test',
      cwd: './frontend',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
