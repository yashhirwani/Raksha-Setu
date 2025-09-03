/**
 * Mock blockchain utilities for digital ID generation
 * In a real implementation, this would integrate with actual blockchain networks
 */

export interface BlockchainId {
  hash: string;
  timestamp: number;
  publicKey: string;
  signature: string;
}

/**
 * Generate a mock blockchain hash for digital ID
 */
export function generateBlockchainId(): string {
  // Generate a random hex string that looks like a blockchain hash
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  
  return '0x' + Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').substring(0, 10) + '...';
}

/**
 * Validate a blockchain hash format
 */
export function isValidBlockchainHash(hash: string): boolean {
  const blockchainHashPattern = /^0x[a-fA-F0-9]{10}\.\.\./;
  return blockchainHashPattern.test(hash);
}

/**
 * Generate a mock blockchain record for a tourist
 */
export function createDigitalIdRecord(
  touristData: {
    name: string;
    idNumber: string;
    nationality: string;
    emergencyContact: string;
  }
): BlockchainId {
  const timestamp = Date.now();
  const hash = generateBlockchainId();
  
  // Mock public key generation
  const publicKey = generateMockPublicKey();
  
  // Mock digital signature
  const signature = generateMockSignature(touristData, timestamp);
  
  return {
    hash,
    timestamp,
    publicKey,
    signature,
  };
}

/**
 * Generate a mock public key
 */
function generateMockPublicKey(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a mock digital signature
 */
function generateMockSignature(data: any, timestamp: number): string {
  const dataString = JSON.stringify(data) + timestamp.toString();
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  // Simple hash-like signature generation
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16) + Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').substring(0, 32);
}

/**
 * Verify a digital ID (mock implementation)
 */
export function verifyDigitalId(
  blockchainId: BlockchainId,
  touristData: any
): boolean {
  // In a real implementation, this would verify against the blockchain
  // For now, we just check if the hash format is valid
  return isValidBlockchainHash(blockchainId.hash) && 
         blockchainId.timestamp > 0 &&
         blockchainId.publicKey.length === 64 &&
         blockchainId.signature.length > 0;
}

/**
 * Get blockchain network status (mock)
 */
export function getBlockchainStatus(): {
  network: string;
  status: 'online' | 'offline' | 'syncing';
  blockHeight: number;
  lastUpdate: Date;
} {
  return {
    network: 'SafeTravel Network',
    status: 'online',
    blockHeight: Math.floor(Math.random() * 1000000) + 500000,
    lastUpdate: new Date(),
  };
}
