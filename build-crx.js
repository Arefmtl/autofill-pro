// Build CRX3 file — proper format
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const extensionDir = process.argv[2] || '.';
const outputPath = process.argv[3] || 'extension.crx';
const keyPath = process.argv[4] || 'extension.pem';
const pubKeyPath = keyPath.replace('.pem', '.pub');

console.log('🔧 Building CRX3...');

// Read manifest
const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'));
console.log(`📦 Extension: ${manifest.name} v${manifest.version}`);

// Generate or read key pair
let privateKey, publicKeyDer;
if (fs.existsSync(keyPath) && fs.existsSync(pubKeyPath)) {
  privateKey = fs.readFileSync(keyPath, 'utf8');
  publicKeyDer = fs.readFileSync(pubKeyPath);
  console.log('🔑 Using existing key pair');
} else {
  const { privateKey: pk, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'der' }
  });
  privateKey = pk;
  publicKeyDer = publicKey;
  fs.writeFileSync(keyPath, privateKey);
  fs.writeFileSync(pubKeyPath, publicKeyDer);
  console.log('🔑 Generated new key pair');
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
  'content/interview-prep.js',
  'content/skill-gap.js',
  'content/dashboard.js',
  'content/drafter-reviewer.js',
  'content/salary-benchmark.js',
  'content/ats-verification.js',
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

// Create ZIP
const { execSync } = require('child_process');
const zipPath = path.join(extensionDir, 'extension.zip');

// Remove old zip if exists
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

// Create zip with only included files
const existingFiles = includeFiles.filter(f => fs.existsSync(path.join(extensionDir, f)));
const zipCmd = `cd "${extensionDir}" && zip -j "${zipPath}" ${existingFiles.join(' ')}`;

try {
  execSync(zipCmd, { stdio: 'pipe' });
  console.log(`📦 ZIP created (${existingFiles.length} files)`);
} catch (e) {
  console.error('ZIP failed:', e.message);
  process.exit(1);
}

// Read ZIP
const zipBuffer = fs.readFileSync(zipPath);
console.log(`📦 ZIP size: ${(zipBuffer.length / 1024).toFixed(1)}KB`);

// CRX3 signed data format:
// - CRX version (4 bytes, little-endian) = 3
// - Name hash (32 bytes, SHA256 of "CRX-3" + public key)
// - Origin hash (32 bytes, SHA256 of origin URL)

const crxVersion = Buffer.alloc(4);
crxVersion.writeUInt32LE(3, 0);

const nameHash = crypto.createHash('sha256')
  .update(Buffer.from('CRX-3'))
  .update(publicKeyDer)
  .digest();

const originHash = crypto.createHash('sha256')
  .update(Buffer.from('https://arefmtl.github.io/autofill-pro/'))
  .digest();

const signedData = Buffer.concat([crxVersion, nameHash, originHash]);

// Sign the signed data
const sign = crypto.createSign('SHA256');
sign.update(signedData);
const signature = sign.sign(crypto.createPrivateKey(privateKey));

// Build header
const signedDataLength = Buffer.alloc(4);
signedDataLength.writeUInt32LE(signedData.length, 0);

const signatureLength = Buffer.alloc(4);
signatureLength.writeUInt32LE(signature.length, 0);

const headerLength = Buffer.alloc(4);
headerLength.writeUInt32LE(
  signedDataLength.length + signedData.length + signatureLength.length + signature.length,
  0
);

const header = Buffer.concat([
  signedDataLength,
  signedData,
  signatureLength,
  signature,
  headerLength
]);

// Build CRX file
const magic = Buffer.from('Cr24');
const version = Buffer.alloc(4);
version.writeUInt32LE(3, 0);

const headerSize = Buffer.alloc(4);
headerSize.writeUInt32LE(header.length, 0);

const crx = Buffer.concat([magic, version, headerSize, header, zipBuffer]);

// Write CRX file
fs.writeFileSync(outputPath, crx);
console.log(`✅ CRX3 built: ${outputPath} (${(crx.length / 1024).toFixed(1)}KB)`);

// Cleanup
fs.unlinkSync(zipPath);
console.log('🧹 Done');
