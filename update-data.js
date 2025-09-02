// Script to add favorite property to all data items
const fs = require('fs');
const path = require('path');

// Read the current data file
const dataPath = path.join(__dirname, 'data.js');
let content = fs.readFileSync(dataPath, 'utf8');

// Add favorite: false to all items that don't have it
content = content.replace(/validationPlan: "Aug 2025"(?!\s*,\s*favorite:)/g, 'validationPlan: "Aug 2025",\n    favorite: false');

// Write back to file
fs.writeFileSync(dataPath, content, 'utf8');

console.log('Added favorite property to all data items!');
