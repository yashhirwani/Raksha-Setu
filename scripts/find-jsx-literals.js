const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && full.endsWith('.tsx')) files.push(full);
  }
  return files;
}

function findLiterals(file) {
  const src = fs.readFileSync(file, 'utf8');
  const results = [];
  // crude regex: capture text between > and < that contains letters and is not only whitespace
  const regex = />\s*([^<>\{\}][^<>\{\}]*)\s*</g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    const txt = m[1].trim();
    // skip if looks like interpolation or starts with { or contains t( or is a tag-like string
    if (!txt) continue;
    if (txt.includes('t(')) continue;
    if (/^\w+:\/\//.test(txt)) continue; // urls
    if (/^[0-9:\-\/,.\s]+$/.test(txt)) continue; // mostly numbers/dates
    // ignore short single words that are likely classnames or attributes
    if (txt.length <= 2) continue;
    // ignore strings already wrapped in translation keys (heuristic: no spaces and all-lower)
    results.push(txt);
  }
  return results;
}

const base = path.join(__dirname, '..', 'client', 'src');
const files = walk(base);
let any = false;
for (const f of files) {
  const lits = findLiterals(f);
  if (lits.length) {
    any = true;
    console.log(`\n== ${f} ==`);
    for (const l of lits) console.log('  -', l.replace(/\s+/g,' ').slice(0,200));
  }
}
if (!any) console.log('\nNo suspicious JSX text nodes found by heuristic.');
