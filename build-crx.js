// Build CRX file — correct version
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const extensionDir = process.argv[2] || '.';
const outputPath = process.argv[3] || 'extension.crx';
const keyPath = process.argv[4] || 'extension.pem';

console.log('🔧 Building CRX...');

// Read manifest
const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'));
console.log(`📦 Extension: ${manifest.name} v${manifest.version}`);

// Generate or read key
let privateKey;
if (fs.existsSync(keyPath)) {
  privateKey = fs.readFileSync(keyPath, 'utf8');
  console.log('🔑 Using existing key');
} else {
  const { privateKey: pk } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  privateKey = pk;
  fs.writeFileSync(keyPath, privateKey);
  console.log('🔑 Generated new key');
}

// Files to include
const includeFiles = [
  'manifest.json',
  'background/service-worker.js',
  'background/ai.js',
  'background/gmail-api.js',
  'background/email-categorizer.js',
  'content/content.js',
  'content/sidebar.js',
  'content/job-detector.js',
  'content/gmail-integration.js',
  'content/referral-finder.js',
  'popup/popup.html',
  'popup/popup.js',
  'popup/popup.css',
  'popup/tracker.html',
  'popup/retouch.html',
  'lib/pdf.min.mjs',
  'lib/pdf.worker.min.mjs',
  'lib/jszip.min.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'utils/crypto.js',
  'logo.png'
];

// Create ZIP manually
const { execSync } = require('child_process');

// Use system zip
const zipPath = path.join(extensionDir, 'extension.zip');
const fileArgs = includeFiles.filter(f => fs.existsSync(path.join(extensionDir, f))).join(' ');

try {
  execSync(`cd ${extensionDir} && zip -j ${zipPath} ${fileArgs}`, { stdio: 'pipe' });
  console.log('📦 ZIP created');
} catch (e) {
  console.error('ZIP failed, trying tar...');
  execSync(`cd ${extensionDir} && tar czf ${zipPath} ${fileArgs}`, { stdio: 'pipe' });
  console.log('📦 TAR created');
}

// Read ZIP
const zipBuffer = fs.readFileSync(zipPath);
console.log(`📦 ZIP size: ${(zipBuffer.length / 1024).toFixed(1)}KB`);

// CRX3 header
const header = Buffer.alloc(12);
header.write('Cr24', 0); // magic
header.writeUInt32LE(3, 4); // version
header.writeUInt32LE(12, 8); // header size

// Sign
const sign = crypto.createSign('SHA256');
sign.update(zipBuffer);
const signature = sign.sign(crypto.createPrivateKey(privateKey));

// Build CRX: header + signature + zip
const crx = Buffer.concat([header, signature, zipBuffer]);
fs.writeFileSync(outputPath, crx);

console.log(`✅ CRX built: ${outputPath} (${(crx.length / 1024).toFixed(1)}KB)`);

// Cleanup
fs.unlinkSync(zipPath);
console.log('🧹 Done');
