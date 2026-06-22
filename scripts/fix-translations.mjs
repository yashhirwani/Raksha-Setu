import { promises as fs } from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'client', 'src');
const enPath = path.resolve(process.cwd(), 'client', 'src', 'translations', 'en.json');

function prettify(key) {
  return key
    .replace(/_+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

async function findKeys() {
  const files = await walk(root);
  const keySet = new Set();
  const re = /t\(\s*['\"]([a-z0-9_]+)['\"]\s*\)/gi;
  for (const f of files) {
    const content = await fs.readFile(f, 'utf8');
    let m;
    while ((m = re.exec(content)) !== null) {
      keySet.add(m[1]);
    }
  }
  return [...keySet].sort();
}

async function main() {
  console.log('Scanning source for translation keys...');
  const keys = await findKeys();
  console.log(`Found ${keys.length} unique keys.`);

  const enRaw = await fs.readFile(enPath, 'utf8');
  let enJson = {};
  try { enJson = JSON.parse(enRaw); } catch (e) { console.error('Failed to parse en.json:', e); process.exit(2); }

  let added = 0;
  for (const k of keys) {
    if (!(k in enJson)) {
      enJson[k] = prettify(k);
      added++;
      console.log('Adding:', k, '->', enJson[k]);
    }
  }

  if (added === 0) {
    console.log('No missing keys. en.json is up to date.');
    return;
  }

  // write back with stable ordering: existing keys preserved, new keys appended alphabetically
  const existing = Object.keys(JSON.parse(enRaw));
  const mergedKeys = Array.from(new Set([...existing, ...Object.keys(enJson)]) );
  // ensure human-friendly order: existing first, then new sorted
  const newObj = {};
  for (const k of mergedKeys) {
    newObj[k] = enJson[k];
  }

  await fs.writeFile(enPath, JSON.stringify(newObj, null, 2) + '\n', 'utf8');
  console.log(`Wrote updated en.json with ${added} new keys.`);
}

main().catch(err => { console.error(err); process.exit(1); });
