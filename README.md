# SuiSealrus SDK

A Node.js SDK for Sui blockchain integration with SEAL encryption and Walrus storage.

## Features

- **File Encryption**: Encrypt files using SEAL threshold encryption
- **Walrus Storage**: Upload encrypted files to decentralized Walrus storage
- **User Whitelisting**: Manage access control through Sui smart contracts
- **Simple API**: Easy-to-use interface for developers

## Installation

```bash
npm install sui-sealrus-sdk
```

## Quick Start

1. **Setup Environment Variables**

Create a `.env` file with your configuration:

```env
# Single keyphrase for all roles
MASTER_KEYPHRASE="your 12-word mnemonic phrase"

# Contract addresses (from your deployment)
PACKAGE_ID=0x...
WHITELIST_ID=0x...
WHITELIST_CAP_ID=0x...

# Walrus endpoints
PUBLISHER_ENDPOINT=https://publisher.walrus-testnet.walrus.space
AGGREGATOR_ENDPOINT=https://aggregator.walrus-testnet.walrus.space
```

2. **Basic Usage**

```typescript
import { SuiSealrusClient, SuiSealrusConfig } from 'sui-sealrus-sdk';
import * as fs from 'fs';

const config: SuiSealrusConfig = {
  network: 'testnet',
  fullnodeUrl: 'https://fullnode.testnet.sui.io:443',
  packageId: process.env.PACKAGE_ID!,
  whitelistId: process.env.WHITELIST_ID!,
  whitelistCapId: process.env.WHITELIST_CAP_ID!,
  publisherEndpoint: process.env.PUBLISHER_ENDPOINT,
  aggregatorEndpoint: process.env.AGGREGATOR_ENDPOINT,
  whitelisterKeyphrase: process.env.MASTER_KEYPHRASE,
  encrypterKeyphrase: process.env.MASTER_KEYPHRASE,
  blobUploaderKeyphrase: process.env.MASTER_KEYPHRASE
};

const client = new SuiSealrusClient(config);

// Whitelist a user (only needed once per address)
await client.addUserToWhitelist('0x...');

// Encrypt and upload a file
const fileData = fs.readFileSync('myfile.txt');
const result = await client.encryptAndUpload(fileData, '0x...');

console.log('File uploaded successfully!');
console.log('Blob ID:', result.storageInfo?.blobId);
console.log('Encryption ID:', result.encryptionId);
```

## API Reference

### SuiSealrusClient

#### Constructor
```typescript
new SuiSealrusClient(config: SuiSealrusConfig)
```

#### Methods

##### `addUserToWhitelist(userAddress: string): Promise<WhitelistResult>`
Adds a user address to the whitelist for decryption access.

##### `encryptAndUpload(file: Buffer, userAddress: string): Promise<EncryptionResult>`
Encrypts a file using SEAL and uploads it to Walrus storage.

## Decryption

For decryption functionality, refer to the frontend implementation in `examples/frontend-decryption.ts`. The SDK focuses on encryption and upload, while decryption is handled in the frontend using the user's wallet for proper SessionKey signing.

## Development

```bash
# Install dependencies
npm install

# Run the example
npm run dev
```

## License

MIT