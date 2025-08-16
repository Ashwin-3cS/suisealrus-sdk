// Main exports
export { SuiSealrusClient } from './core/SuiSealrusClient';

// Type exports
export type {
  SuiSealrusConfig,
  WhitelistResult,
  EncryptionResult,
  StorageInfo
} from './types';

// Utility exports
export {
  validateConfig,
  createDefaultConfig,
  mergeWithDefaults,
  isValidSuiAddress,
  normalizeSuiAddress,
  formatFileSize,
  generateNonce,
  sleep,
  retry,
  isValidMnemonic,
  maskSensitiveData
} from './utils/helpers';

// Re-export commonly used Sui types for convenience
export type { SuiClient } from '@mysten/sui/client';
export type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
export type { Transaction } from '@mysten/sui/transactions';