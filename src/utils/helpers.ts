import { SuiSealrusConfig } from '../types';

/**
 * Validate the configuration object
 */
export function validateConfig(config: SuiSealrusConfig): string[] {
  const errors: string[] = [];

  if (!config.fullnodeUrl) {
    errors.push('fullnodeUrl is required');
  }

  if (!config.packageId) {
    errors.push('packageId is required');
  }

  if (!config.network) {
    errors.push('network is required');
  }

  if (!['mainnet', 'testnet', 'devnet', 'localnet'].includes(config.network)) {
    errors.push('network must be one of: mainnet, testnet, devnet, localnet');
  }

  return errors;
}

/**
 * Create a default configuration template
 */
export function createDefaultConfig(): Partial<SuiSealrusConfig> {
  return {
    network: 'testnet',
    fullnodeUrl: 'https://fullnode.testnet.sui.io:443',
    moduleName: 'did_whitelist_contract',
    attestationModuleName: 'attestation',
    clockId: '0x6',
    numEpochs: 1,
  };
}

/**
 * Merge configurations with defaults
 */
export function mergeWithDefaults(config: SuiSealrusConfig): SuiSealrusConfig {
  const defaults = createDefaultConfig();
  return { ...defaults, ...config } as SuiSealrusConfig;
}

/**
 * Validate Sui address format
 */
export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

/**
 * Normalize Sui address (ensure 0x prefix and proper length)
 */
export function normalizeSuiAddress(address: string): string {
  let normalized = address.toLowerCase();
  if (!normalized.startsWith('0x')) {
    normalized = '0x' + normalized;
  }
  
  // Pad with zeros if needed (Sui addresses should be 64 hex chars + 0x)
  if (normalized.length < 66) {
    const padding = '0'.repeat(66 - normalized.length);
    normalized = '0x' + padding + normalized.slice(2);
  }
  
  return normalized;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a random nonce
 */
export function generateNonce(length: number = 5): Buffer {
  return Buffer.from(Array.from({ length }, () => Math.floor(Math.random() * 256)));
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility for operations that might fail
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, lastError.message);
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError!;
}

/**
 * Check if a string is a valid mnemonic phrase
 */
export function isValidMnemonic(phrase: string): boolean {
  const words = phrase.trim().split(/\s+/);
  return words.length >= 12 && words.length <= 24 && words.length % 3 === 0;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const middle = '*'.repeat(data.length - visibleChars * 2);
  
  return start + middle + end;
}