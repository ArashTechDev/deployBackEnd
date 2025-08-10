/* eslint-disable linebreak-style */
// backend/scripts/dev-start.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const checkEnv = () => {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found. Creating from .env.example...');
    const examplePath = path.join(__dirname, '../.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log('✅ .env file created. Please update with your configuration.');
    } else {
      console.log('❌ .env.example not found. Please create .env manually.');
      return false;
    }
  }
  return true;
};

const startDev = async () => {
  console.log('🚀 Starting ByteBasket Backend Development Server...\n');
  
  // Check environment
  if (!checkEnv()) {
    process.exit(1);
  }
  
  // Ask if user wants to setup demo data
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Setup demo data? (y/N): ', (answer) => {
    readline.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('📦 Setting up demo data...');
      const setupDemo = spawn('node', ['scripts/setup-demo.js'], { stdio: 'inherit' });
      
      setupDemo.on('close', (code) => {
        if (code === 0) {
          console.log('\n🚀 Starting development server...');
          const devServer = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
        } else {
          console.log('❌ Demo setup failed');
        }
      });
    } else {
      console.log('🚀 Starting development server...');
      const devServer = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
    }
  });
};

startDev();