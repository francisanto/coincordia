# BNB Greenfield Environment Variables Setup

To make your app store data in BNB Greenfield (not localhost), you need to set these environment variables in Railway:

## Required Environment Variables

### 1. GREENFIELD_ENDPOINT
```
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
```

### 2. GREENFIELD_CHAIN_ID
```
GREENFIELD_CHAIN_ID=5600
```

### 3. GREENFIELD_BUCKET
```
GREENFIELD_BUCKET=0x000000000000000000000000000000000000000000000000000000000000566f
```

### 4. GREENFIELD_ACCOUNT_ADDRESS
```
GREENFIELD_ACCOUNT_ADDRESS=0xYourGreenfieldAccountAddress
```

## How to Set Environment Variables in Railway

1. Go to your Railway dashboard
2. Select your project
3. Go to the "Variables" tab
4. Add each environment variable above
5. Deploy your app

## What This Does

- **GREENFIELD_ENDPOINT**: Points to BNB Greenfield testnet
- **GREENFIELD_CHAIN_ID**: Testnet chain ID (5600)
- **GREENFIELD_BUCKET**: Your bucket name for storing data
- **GREENFIELD_ACCOUNT_ADDRESS**: Your account that has write permissions to the bucket

## Testing

After setting these variables:
1. Create a group in your app
2. Check the browser console for logs like:
   - `✅ Greenfield client initialized`
   - `💾 Storing group data in BNB Greenfield...`
   - `✅ Group stored successfully in BNB Greenfield`
   - `🔗 Transaction hash: [hash]`

## Important Notes

- Data will be stored permanently in BNB Greenfield
- All users can access the same data
- No data is stored in localhost or browser storage
- Groups will persist across browser sessions and devices 