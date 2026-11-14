'use strict';
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function versionAssets(directory) {
  for (const page of ['index.html', 'electricity.html']) {
    const filename = path.join(directory, page);
    const html = fs.readFileSync(filename, 'utf8');
    const versioned = html.replace(/\b(src|href)="([\w.-]+\.(?:js|css))(?:\?v=[a-f0-9]+)?"/g, (_, attribute, asset) => {
      const content = fs.readFileSync(path.join(directory, asset));
      const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
      return `${attribute}="${asset}?v=${hash}"`;
    });
    if (versioned !== html) fs.writeFileSync(filename, versioned);
  }
}

if (require.main === module) {
  versionAssets(path.resolve(__dirname, '..'));
  console.log('Updated JS/CSS versions on both pages.');
}
module.exports = { versionAssets };
