#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('==========================================');
console.log('🚀 Launching FinTrack API Production Server');
console.log('==========================================');

const serverDir = path.join(__dirname, 'server');

// Ensure server dependencies are installed
if (!fs.existsSync(path.join(serverDir, 'node_modules'))) {
  console.log('Installing server dependencies...');
  require('child_process').execSync('npm install', { cwd: serverDir, stdio: 'inherit' });
}

// Automatically sync database schema with cloud database on launch
if (process.env.DATABASE_URL) {
  try {
    console.log('🔄 Syncing database tables with Prisma schema...');
    require('child_process').execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
      cwd: serverDir,
      stdio: 'inherit',
      env: process.env
    });
    console.log('✅ Database schema synchronized successfully.');
  } catch (err) {
    console.warn('⚠️ Prisma db push note:', err.message);
  }
}

const child = spawn('node', ['src/index.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: process.env
});

child.on('error', (err) => {
  console.error('Failed to start server process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
