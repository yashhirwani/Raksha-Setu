import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

const base = 'http://localhost:5000';

async function waitForService(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/api/safety-zones`, { method: 'GET' });
      if (res.ok) return true;
    } catch (e) {
      // ignore and retry
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function run() {
  console.log('Waiting for service at', base);
  const ok = await waitForService(20000);
  if (!ok) {
    console.error('Service did not become available within timeout');
    process.exit(2);
  }

  console.log('GET /api/safety-zones');
  let r = await fetch(`${base}/api/safety-zones`);
  console.log('status', r.status);
  console.log(await r.json());

  console.log('POST /api/trip-itineraries (upload)');
  const fd = new FormData();
  fd.append('touristId', 'demo-tourist-1');
  fd.append('itineraryName', 'Demo Trip');
  fd.append('itinerary', fs.createReadStream('server/test-data/sample-itinerary.txt'));
  r = await fetch(`${base}/api/trip-itineraries`, { method: 'POST', body: fd as any });
  console.log('status', r.status);
  const trip: any = await r.json();
  console.log('trip', trip);

  console.log('POST /api/trips/start');
  r = await fetch(`${base}/api/trips/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: trip.id }) });
  console.log('status', r.status);
  console.log(await r.json());

  console.log('POST /api/safety-alerts (panic)');
  r = await fetch(`${base}/api/safety-alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Panic', message: 'Panic from demo', type: 'emergency', area: 'demo-area' }) });
  console.log('status', r.status);
  console.log(await r.json());

  console.log('GET /api/incident-heatmap');
  r = await fetch(`${base}/api/incident-heatmap`);
  console.log('status', r.status);
  console.log(await r.json());
}

run().catch(err => { console.error(err); process.exit(1); });
