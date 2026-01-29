const fs = require('fs');
const path = require('path');

// Create directories
const dirs = ['controllers', 'models', 'routes', 'config', 'middleware', 'services', 'utils'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Created directory: ${dir}`);
  }
});

console.log('All directories created successfully!');
console.log('Now create the individual files using the provided code.');
