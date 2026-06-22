#!/usr/bin/env node
// Simple script to populate missing translations by calling the server translate proxy
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const enPath = path.join(root, 'client', 'src', 'translations', 'en.json');
const hiPath = path.join(root, 'client', 'src', 'translations', 'hi.json');

async function main() {
  const enRaw = await fs.readFile(enPath, 'utf8');
  const hiRaw = await fs.readFile(hiPath, 'utf8');
  const en = JSON.parse(enRaw);
  const hi = JSON.parse(hiRaw);

  const missing = Object.keys(en).filter(k => !hi[k]);
  if (missing.length === 0) {
    console.log('No missing keys to populate');
    return;
  }

  const serverTranslate = async (text) => {
    try {
      const res = await fetch('http://localhost:5000/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, target: 'hi' }) });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      const json = await res.json();
      return json.translated ?? json.translatedText ?? null;
    } catch (err) {
      console.error('Server translate failed:', err.message || err);
      return null;
    }
  };

  for (const key of missing) {
    const text = en[key];
    const translated = await serverTranslate(text);
    if (translated) {
      hi[key] = translated;
      console.log('Populated', key);
    } else {
      console.log('Skipped', key);
    }
  }

  await fs.writeFile(hiPath, JSON.stringify(hi, null, 2), 'utf8');
  console.log('Done. Wrote', hiPath);
}

main().catch(err => { console.error(err); process.exit(1); });
