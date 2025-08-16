export interface SuiSealrusConfig {
  fullnodeUrl: string;
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  packageId: string;
  whitelistId?: string;
  whitelistCapId?: string;
  publisherEndpoint?: string;
  aggregatorEndpoint?: string;
  numEpochs?: number;
  whitelisterKeyphrase?: string;
  encrypterKeyphrase?: string;
  blobUploaderKeyphrase?: string;
}

export interface WhitelistResult {
  success: boolean;
  transactionDigest?: string;
  userAddress: string;
  error?: string;
}

export interface EncryptionResult {
  success: boolean;
  encryptionId?: string;
  encryptedSize?: number;
  storageInfo?: StorageInfo;
  uploadInfo?: StorageInfo;
  error?: string;
}

export interface StorageInfo {
  status: string;
  blobId?: string;
  blobUrl?: string;
  encryptionId?: string;
}
