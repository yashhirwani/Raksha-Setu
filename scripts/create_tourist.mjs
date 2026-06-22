(async () => {
  try {
    // Use dynamic import for node-fetch to avoid require() ESM errors.
    const { default: fetch } = await import('node-fetch');

    const payload = {
      name: 'E2E Script Tester',
      idNumber: 'E2ETEST1234',
      nationality: 'India',
      emergencyContact: '+919000000000'
    };

    const post = await fetch('http://localhost:5000/api/tourists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('POST status:', post.status);
    const created = await post.json();
    console.log('created:', created);

    const get = await fetch('http://localhost:5000/api/tourists/id-number/' + encodeURIComponent(payload.idNumber));
    console.log('GET status:', get.status);
    const fetched = await get.json();
    console.log('fetched:', fetched);
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
})();
