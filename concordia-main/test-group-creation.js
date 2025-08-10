// Import required modules
const { v4: uuidv4 } = require('uuid');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.FRONTEND_URL;

// Test user address
const TEST_USER_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'; // Test address

// Create a test group
async function createTestGroup() {
  const groupId = uuidv4();
  const groupData = {
    groupId,
    name: 'Test Group',
    description: 'This is a test group created to verify group creation functionality',
    creator: TEST_USER_ADDRESS,
    goalAmount: 1000,
    duration: 30,
    withdrawalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    dueDay: 15,
    members: [
      {
        address: TEST_USER_ADDRESS,
        nickname: 'Admin',
        role: 'creator',
        joinedAt: new Date().toISOString(),
        contribution: 0,
        auraPoints: 0,
        hasVoted: false,
        status: 'active'
      }
    ]
  };

  try {
    console.log('🔄 Creating test group...');
    // Use the backend API directly
    const response = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ group: groupData })
    });

    if (!response.ok) {
      throw new Error(`Failed to create group: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Test group created successfully:', result.group.groupId);
    return result.group;
  } catch (error) {
    console.error('❌ Error creating test group:', error.message);
    return null;
  }
}

// Retrieve the test group
async function getTestGroup(groupId) {
  try {
    console.log('🔄 Retrieving test group...');
    const response = await fetch(`${API_URL}/groups/${groupId}?address=${TEST_USER_ADDRESS}`);

    if (!response.ok) {
      throw new Error(`Failed to retrieve group: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Test group retrieved successfully:', result.group.groupId);
    return result.group;
  } catch (error) {
    console.error('❌ Error retrieving test group:', error.message);
    return null;
  }
}

// Delete the test group
async function deleteTestGroup(groupId) {
  try {
    console.log('🔄 Deleting test group...');
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address: TEST_USER_ADDRESS })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete group: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Test group deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting test group:', error.message);
    return false;
  }
}

// Run the test
async function runTest() {
  // Create a test group
  const testGroup = await createTestGroup();
  if (!testGroup) {
    console.error('❌ Test failed: Could not create test group');
    return;
  }
  
  // Retrieve the test group
  const retrievedGroup = await getTestGroup(testGroup.groupId);
  if (!retrievedGroup) {
    console.error('❌ Test failed: Could not retrieve test group');
    return;
  }
  
  // Delete the test group
  const deleted = await deleteTestGroup(testGroup.groupId);
  if (!deleted) {
    console.error('❌ Test failed: Could not delete test group');
    return;
  }
  
  console.log('✅ All tests passed successfully!');
}

// Run the test
runTest().catch(error => {
  console.error('❌ Unhandled error during test:', error);
});