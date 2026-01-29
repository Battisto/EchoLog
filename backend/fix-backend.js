const fs = require('fs');
const path = require('path');

// Create directories
const dirs = ['controllers', 'models', 'routes', 'config', 'middleware'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory already exists: ${dir}`);
  }
});

console.log('\n🎉 Backend structure ready!');
console.log('Now create the individual files using the provided code.');

// Check if essential files exist
const essentialFiles = [
  'controllers/eventController.js',
  'models/Event.js',
  'routes/events.js',
  'config/database.js',
  'middleware/errorHandler.js'
];

console.log('\n📋 Files you still need to create:');
essentialFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`❌ Missing: ${file}`);
  } else {
    console.log(`✅ Exists: ${file}`);
  }
});
