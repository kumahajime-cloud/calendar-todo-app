// Generate PWA icons with bear emoji
const fs = require('fs');
const path = require('path');

// Create SVG with bear emoji
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1e3a8a" rx="${size * 0.15}"/>
  <text 
    x="50%" 
    y="50%" 
    font-size="${size * 0.6}" 
    text-anchor="middle" 
    dominant-baseline="central"
    font-family="system-ui, -apple-system, sans-serif"
  >🐻</text>
</svg>`;

// Save SVG files
const publicDir = path.join(__dirname, 'public');

fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), createSVG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createSVG(512));

console.log('✓ SVG icons generated successfully');
console.log('  - public/icon-192.svg');
console.log('  - public/icon-512.svg');
console.log('\nNote: For better compatibility, consider converting these to PNG using an image editor or online tool.');
