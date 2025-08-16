import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex, toHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
// @ts-ignore: SealClient types may not be available
import { getAllowlistedKeyServers, SealClient } from '@mysten/seal';
import * as crypto from 'crypto';
import axios from 'axios';

import {
  SuiSealrusConfig,
  WhitelistResult,
  EncryptionResult,
  StorageInfo
} from '../types';

export class SuiSealrusClient {
  private config: SuiSealrusConfig;
  private suiClient: SuiClient;
  private sealClient?: any; // Use any if SealClient type is missing
  private whitelisterKeypair?: Ed25519Keypair;
  private encrypterKeypair?: Ed25519Keypair;
  private blobUploaderKeypair?: Ed25519Keypair;

  constructor(config: SuiSealrusConfig) {
    this.config = {
      numEpochs: 1, // Default value
      ...config
    };
    this.suiClient = new SuiClient({ url: this.config.fullnodeUrl });
    this.initializeKeypairs();
    this.initializeSealClient();
  }

  private initializeKeypairs(): void {
    try {
      if (this.config.whitelisterKeyphrase) {
        this.whitelisterKeypair = Ed25519Keypair.deriveKeypair(this.config.whitelisterKeyphrase);
      }
      if (this.config.encrypterKeyphrase) {
        this.encrypterKeypair = Ed25519Keypair.deriveKeypair(this.config.encrypterKeyphrase);
      }
      if (this.config.blobUploaderKeyphrase) {
        this.blobUploaderKeypair = Ed25519Keypair.deriveKeypair(this.config.blobUploaderKeyphrase);
      }
    } catch (error) {
      console.error('Error initializing keypairs:', error);
    }
  }

  private initializeSealClient(): void {
    try {
      if (this.config.network === 'testnet' || this.config.network === 'mainnet') {
        this.sealClient = new SealClient({
          suiClient: this.suiClient as any, // Type assertion to bypass version mismatch
          serverObjectIds: getAllowlistedKeyServers(this.config.network),
          verifyKeyServers: false,
        });
      }
    } catch (error) {
      console.error('Error initializing SEAL client:', error);
    }
  }

  async addUserToWhitelist(userAddress: string): Promise<WhitelistResult> {
    try {
      if (!this.whitelisterKeypair) {
        throw new Error('Whitelister keypair not configured');
      }
      if (!this.config.whitelistId || !this.config.whitelistCapId) {
        throw new Error('Whitelist configuration missing');
      }
      const transaction = new Transaction();
      transaction.moveCall({
        target: `${this.config.packageId}::did_whitelist_contract::add`,
        arguments: [
          transaction.object(this.config.whitelistId),
          transaction.object(this.config.whitelistCapId),
          transaction.pure.address(userAddress),
        ],
      });
      transaction.setGasBudget(100000000);
      const result = await this.suiClient.signAndExecuteTransaction({
        signer: this.whitelisterKeypair,
        transaction,
        requestType: 'WaitForLocalExecution',
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      });
      return {
        success: true,
        transactionDigest: result.digest,
        userAddress
      };
    } catch (error) {
      return {
        success: false,
        userAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async encryptAndUpload(file: Buffer, userAddress: string): Promise<EncryptionResult> {
    try {
      if (!this.sealClient) {
        throw new Error('SEAL client not initialized');
      }
      const policyObjectId = this.config.whitelistId;
      if (!policyObjectId) {
        throw new Error('Policy object ID required for encryption');
      }
      const fileDataArray = file;
      const nonce = crypto.randomBytes(5);
      const policyObjectBytes = fromHex(policyObjectId);
      const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
      const { encryptedObject: encryptedBytes } = await this.sealClient.encrypt({
        threshold: 2,
        packageId: this.config.packageId,
        id,
        data: fileDataArray,
      });
      let storageInfo: StorageInfo | undefined;
      let uploadInfo: StorageInfo | undefined;
      if (this.config.publisherEndpoint) {
        const walrusResult = await this.storeOnWalrus(encryptedBytes);
        console.log('Walrus upload result:', JSON.stringify(walrusResult.info, null, 2));
        
        // Extract the actual blob ID from the Walrus response
        const blobId = walrusResult.info.newlyCreated?.blobObject?.blobId;
        if (!blobId) {
          throw new Error('Failed to get blob ID from Walrus response');
        }
        
        storageInfo = {
          status: 'Uploaded',
          blobId: blobId,
          blobUrl: this.getAggregatorUrl(`blobs/${blobId}`),
          encryptionId: id
        };
        uploadInfo = storageInfo;
        
        console.log('Storage info created:', {
          blobId: storageInfo.blobId,
          encryptionId: storageInfo.encryptionId
        });
      }
      return {
        success: true,
        encryptionId: id,
        encryptedSize: encryptedBytes.length,
        storageInfo,
        uploadInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async storeOnWalrus(encryptedData: Uint8Array): Promise<{ info: any }> {
    if (!this.config.publisherEndpoint) throw new Error('Publisher endpoint not configured');
    const url = `${this.config.publisherEndpoint}/v1/blobs?epochs=${this.config.numEpochs}`;
    console.log('Uploading to Walrus URL:', url);
    
    // Walrus expects PUT request, not POST (as seen in frontend code)
    const response = await axios.put(url, encryptedData, {
      headers: { 'Content-Type': 'application/octet-stream' },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    if (response.status === 200) {
      console.log('Walrus upload successful:', response.data);
      return { info: response.data };
    }
    throw new Error(`Error uploading blob: ${response.status}`);
  }

  private getAggregatorUrl(path: string): string {
    if (!this.config.aggregatorEndpoint) return '';
    return `${this.config.aggregatorEndpoint}/v1/${path}`;
  }
}