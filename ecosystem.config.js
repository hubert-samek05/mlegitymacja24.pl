module.exports = {
  apps: [
    {
      name: 'mlegitymacja24-backend',
      script: 'dist/server.js',
      cwd: '/root/CascadeProjects/mlegitymacja24/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 7000,
      },
      error_file: '/root/.pm2/logs/mlegitymacja24-backend-error.log',
      out_file: '/root/.pm2/logs/mlegitymacja24-backend-out.log',
      log_file: '/root/.pm2/logs/mlegitymacja24-backend.log',
      time: true,
    },
    {
      name: 'mlegitymacja24-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/root/CascadeProjects/mlegitymacja24/frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 7001,
      },
      error_file: '/root/.pm2/logs/mlegitymacja24-frontend-error.log',
      out_file: '/root/.pm2/logs/mlegitymacja24-frontend-out.log',
      log_file: '/root/.pm2/logs/mlegitymacja24-frontend.log',
      time: true,
    },
  ],
};
