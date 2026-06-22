export async function hashPassword(password: string) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveCredential(idNumber: string, password: string) {
  const hash = await hashPassword(password);
  const creds = JSON.parse(localStorage.getItem('creds') || '{}');
  creds[idNumber] = hash;
  localStorage.setItem('creds', JSON.stringify(creds));
}

export async function verifyCredential(idNumber: string, password: string) {
  const hash = await hashPassword(password);
  const creds = JSON.parse(localStorage.getItem('creds') || '{}');
  return creds[idNumber] && creds[idNumber] === hash;
}
