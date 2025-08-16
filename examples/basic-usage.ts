import { SuiSealrusClient } from '../src/core/SuiSealrusClient';
import { SuiSealrusConfig } from '../src/types';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config: SuiSealrusConfig = {
  network: 'testnet',
  fullnodeUrl: 'https://fullnode.testnet.sui.io:443',
  packageId: process.env.PACKAGE_ID!,
  whitelistId: process.env.WHITELIST_ID!,
  whitelistCapId: process.env.WHITELIST_CAP_ID!,
  // Re-enable Walrus endpoints
  publisherEndpoint: process.env.PUBLISHER_ENDPOINT,
  aggregatorEndpoint: process.env.AGGREGATOR_ENDPOINT,
  whitelisterKeyphrase: process.env.MASTER_KEYPHRASE,
  encrypterKeyphrase: process.env.MASTER_KEYPHRASE,
  blobUploaderKeyphrase: process.env.MASTER_KEYPHRASE
};

async function main() {
  const client = new SuiSealrusClient(config);
  const userAddress = '0x451f84370f7fd107cc8fa017aa846d6c5aa78c18133a4eef86a4d1c6b9695f18'; // Your address
  const fileData = fs.readFileSync('examples/testfile.txt');

  console.log('Starting SuiSealrus SDK Test (Encryption and Upload Flow)...');
  console.log('Using Walrus endpoints:', process.env.PUBLISHER_ENDPOINT);
  
  // 1. Whitelist the user (ONLY ONCE needed per address)
  console.log('Adding user to whitelist...');
  const whitelistResult = await client.addUserToWhitelist(userAddress);
  if (!whitelistResult.success) {
    console.error('Failed to whitelist user:', whitelistResult.error);
    return;
  }
  console.log('User whitelisted:', whitelistResult.transactionDigest);
  console.log('Note: This user is now whitelisted permanently - no need to call again!');

  // 2. Encrypt and upload to Walrus
  console.log('Encrypting and uploading file to Walrus...');
  const encryptResult = await client.encryptAndUpload(fileData, userAddress);
  if (!encryptResult.success) {
    console.error('Failed to encrypt/upload file:', encryptResult.error);
    return;
  }
  console.log('File encrypted and uploaded successfully!');
  console.log('   Encryption ID:', encryptResult.encryptionId);
  console.log('   Encrypted size:', encryptResult.encryptedSize, 'bytes');
  console.log('   Walrus Blob ID:', encryptResult.storageInfo?.blobId);
  
  console.log('Complete encryption and upload test successful!');
  console.log('Summary:');
  console.log('   - User whitelisted once (permanent)');
  console.log('   - File encrypted with SEAL');
  console.log('   - File uploaded to Walrus');
  console.log('   - Blob ID available for decryption in frontend');
}

main().catch(console.error); 