# Arweave Key Guide for Concordia IPFS

This guide explains how to generate and use an Arweave key for your Concordia IPFS application's environment variables.

## What is an Arweave Key?

An Arweave key is a JSON Web Key (JWK) that allows your application to interact with the Arweave network. It's used to sign transactions and store data permanently on the Arweave blockchain.

## Generating an Arweave Key

We've provided a script to easily generate a new Arweave key. Follow these steps:

1. Make sure you have Node.js installed
2. Install the required dependency:
   ```
   npm install arweave
   ```
3. Run the generation script:
   ```
   node scripts/generate-arweave-key.js
   ```
4. The script will output:
   - Your Arweave wallet address
   - The complete JWK key
   - The formatted environment variable for Railway

## Using the Arweave Key in Environment Variables

Once you have generated your key, you need to add it to your environment variables:

### For Local Development

Add the key to your `.env.local` file:

```
ARWEAVE_KEY='{"kty":"RSA","n":"...","e":"...","d":"...","p":"...","q":"...","dp":"...","dq":"...","qi":"..."}'  
```

### For Railway Deployment

1. Go to your Railway project dashboard
2. Navigate to the Variables tab
3. Add a new variable named `ARWEAVE_KEY`
4. Paste the entire JWK string as the value (including the outer quotes)

## Important Security Notes

1. **Never commit your Arweave key to version control**
2. Keep your key secure - it controls your Arweave wallet
3. Use Railway's secure environment variable storage
4. A newly generated key has no funds - you'll need to add AR tokens to use it for storing data
5. Consider using different keys for development and production environments

## Funding Your Arweave Wallet

To use your Arweave wallet for storing data, you'll need to add AR tokens to it:

1. Copy your wallet address (output by the generation script)
2. Purchase AR tokens from an exchange that supports Arweave
3. Transfer the tokens to your wallet address

## Verifying Your Arweave Key

You can verify that your Arweave key is correctly configured by running:

```
node -e "const arweave = require('arweave').init({}); const key = JSON.parse(process.env.ARWEAVE_KEY); arweave.wallets.jwkToAddress(key).then(address => console.log('Wallet address:', address));"
```

This should output the wallet address associated with your key.