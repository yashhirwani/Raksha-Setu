import fs from 'fs';
import path from 'path';

function fail(msg: string) {
  console.error('VERIFY FAILED:', msg);
  process.exit(2);
}

function ok(msg: string) {
  console.log('VERIFY OK:', msg);
}

const dataFile = path.join(process.cwd(), 'server', 'data', 'trips.json');
if (!fs.existsSync(dataFile)) fail('trips.json not found');
const raw = fs.readFileSync(dataFile, 'utf-8');
let arr: any[] = [];
try { arr = JSON.parse(raw); } catch (e) { fail('trips.json invalid json') }
if (!Array.isArray(arr) || arr.length === 0) fail('no trips persisted');
ok(`found ${arr.length} trips`);

// verify first trip's itinerary file exists if itineraryUrl provided
const first = arr[0];
if (first.itineraryUrl) {
  const rel = first.itineraryUrl.replace(/^\//, '');
  const full = path.join(process.cwd(), rel);
  if (!fs.existsSync(full)) fail(`itinerary file missing: ${full}`);
  ok(`itinerary file exists: ${full}`);
}

console.log('VERIFICATION PASSED');
process.exit(0);
