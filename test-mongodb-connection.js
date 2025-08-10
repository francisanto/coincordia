const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// MongoDB connection string from .env.local
const MONGODB_URI = 'mongodb+srv://coincordia:coincordiasolly@coincordia.ueslfbm.mongodb.net/?retryWrites=true&w=majority&appName=coincordia';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

// Define a simple Group schema for testing
const GroupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  creator: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create a test group
async function createTestGroup() {
  const Group = mongoose.model('Group', GroupSchema);
  
  const groupId = uuidv4();
  const testGroup = new Group({
    groupId,
    name: 'Test Group',
    description: 'This is a test group created to verify MongoDB connection',
    creator: '0xTestAddress',
  });

  try {
    await testGroup.save();
    console.log('✅ Test group created successfully:', groupId);
    return testGroup;
  } catch (error) {
    console.error('❌ Error creating test group:', error.message);
    return null;
  }
}

// Retrieve the test group
async function getTestGroup(groupId) {
  const Group = mongoose.model('Group', GroupSchema);
  
  try {
    const group = await Group.findOne({ groupId });
    if (group) {
      console.log('✅ Test group retrieved successfully:', group.groupId);
      return group;
    } else {
      console.log('❌ Test group not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error retrieving test group:', error.message);
    return null;
  }
}

// Delete the test group
async function deleteTestGroup(groupId) {
  const Group = mongoose.model('Group', GroupSchema);
  
  try {
    await Group.deleteOne({ groupId });
    console.log('✅ Test group deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting test group:', error.message);
    return false;
  }
}

// Run the test
async function runTest() {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('❌ Test failed: Could not connect to MongoDB');
    return;
  }
  
  // Create a test group
  const testGroup = await createTestGroup();
  if (!testGroup) {
    console.error('❌ Test failed: Could not create test group');
    await mongoose.disconnect();
    return;
  }
  
  // Retrieve the test group
  const retrievedGroup = await getTestGroup(testGroup.groupId);
  if (!retrievedGroup) {
    console.error('❌ Test failed: Could not retrieve test group');
    await mongoose.disconnect();
    return;
  }
  
  // Delete the test group
  const deleted = await deleteTestGroup(testGroup.groupId);
  if (!deleted) {
    console.error('❌ Test failed: Could not delete test group');
    await mongoose.disconnect();
    return;
  }
  
  console.log('✅ All tests passed successfully!');
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('✅ MongoDB disconnected');
}

// Run the test
runTest().catch(error => {
  console.error('❌ Unhandled error during test:', error);
  mongoose.disconnect();
});