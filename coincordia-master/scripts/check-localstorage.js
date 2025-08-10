#!/usr/bin/env node

console.log('🔍 Checking localStorage Data...\n');

// This script needs to run in browser console
console.log('📋 Copy and paste this into your browser console:');
console.log('');

const script = `
// Check localStorage for Concordia data
console.log('🔍 Checking Concordia localStorage data...\\n');

// Check for groups metadata
const metadata = localStorage.getItem('concordia_metadata');
if (metadata) {
  console.log('✅ Found concordia_metadata:');
  const groups = JSON.parse(metadata);
  console.log('   Groups found:', groups.length);
  groups.forEach((group, index) => {
    console.log(\`   Group \${index + 1}: \${group.name} (ID: \${group.id})\`);
    console.log(\`     Creator: \${group.creator}\`);
    console.log(\`     Members: \${group.members?.length || 0}\`);
    console.log(\`     Current Amount: \${group.currentAmount || 0} BNB\`);
  });
} else {
  console.log('❌ No concordia_metadata found');
}

// Check for greenfield references
const greenfieldRefs = localStorage.getItem('greenfield_references');
if (greenfieldRefs) {
  console.log('\\n✅ Found greenfield_references:');
  const refs = JSON.parse(greenfieldRefs);
  console.log('   References:', Object.keys(refs).length);
  Object.keys(refs).forEach(groupId => {
    console.log(\`   Group \${groupId}: \${refs[groupId].objectKey}\`);
  });
} else {
  console.log('\\n❌ No greenfield_references found');
}

// Check for contributions
const contributionKeys = Object.keys(localStorage).filter(key => key.startsWith('contributions_'));
if (contributionKeys.length > 0) {
  console.log('\\n✅ Found contribution data:');
  contributionKeys.forEach(key => {
    const groupId = key.replace('contributions_', '');
    const contributions = JSON.parse(localStorage.getItem(key));
    console.log(\`   Group \${groupId}: \${contributions.length} contributions\`);
  });
} else {
  console.log('\\n❌ No contribution data found');
}

// Check wallet connection
const wagmiConnected = localStorage.getItem('wagmi.connected');
const wagmiAccount = localStorage.getItem('wagmi.account');
if (wagmiConnected || wagmiAccount) {
  console.log('\\n✅ Wallet connection data:');
  console.log('   Connected:', wagmiConnected);
  console.log('   Account:', wagmiAccount);
} else {
  console.log('\\n❌ No wallet connection data found');
}

console.log('\\n🎯 localStorage check complete!');
`;

console.log(script);
console.log('');
console.log('📋 Instructions:');
console.log('1. Open your Concordia app in browser');
console.log('2. Press F12 to open Developer Tools');
console.log('3. Go to Console tab');
console.log('4. Copy and paste the script above');
console.log('5. Press Enter to run');
console.log('');
console.log('🔍 This will show you what data is currently stored locally.'); 