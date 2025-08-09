// Script to generate an Arweave key for environment variables
const Arweave = require('arweave');

// Initialize Arweave
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Generate a new JWK key
console.log('Generating new Arweave key...');
arweave.wallets.generate().then(key => {
  // Get the wallet address associated with the key
  arweave.wallets.jwkToAddress(key).then(address => {
    console.log('\n=============================================================================');
    console.log('ARWEAVE KEY GENERATED SUCCESSFULLY');
    console.log('=============================================================================\n');
    
    console.log(`Wallet Address: ${address}`);
    console.log('\nYour Arweave Key (JWK):');
    console.log('-----------------------------------------------------------------------------');
    console.log(JSON.stringify(key));
    console.log('-----------------------------------------------------------------------------\n');
    
    console.log('For your Railway environment variables, use this format:');
    console.log('-----------------------------------------------------------------------------');
    console.log(`ARWEAVE_KEY='${JSON.stringify(key)}'`);
    console.log('-----------------------------------------------------------------------------\n');
    
    console.log('IMPORTANT SECURITY NOTES:');
    console.log('1. Keep this key secure - it controls your Arweave wallet');
    console.log('2. Never commit this key to version control');
    console.log('3. Use Railway\'s secure environment variable storage');
    console.log('4. This key has no funds - you\'ll need to add AR tokens to use it');
    console.log('=============================================================================');
  });
}).catch(error => {
  console.error('Error generating Arweave key:', error);
});