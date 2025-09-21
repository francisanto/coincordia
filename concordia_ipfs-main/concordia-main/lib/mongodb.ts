import { MongoClient } from 'mongodb';

// Check if we're running on the server side
const isServer = typeof window === 'undefined';

// Only check for environment variables on the server side
if (isServer && !process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Use a safe default for client-side or a proper URI for server-side
const uri = isServer ? process.env.MONGODB_URI || '' : '';
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

let cachedConnection: MongoClient | null = null;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function connectToMongoDB() {
  // If we're in the browser, we can't connect to MongoDB directly
  if (!isServer) {
    console.log('⚠️ Cannot connect to MongoDB from browser');
    throw new Error('MongoDB connections are only supported on the server side');
  }

  if (cachedConnection) {
    console.log('📊 Using existing MongoDB connection');
    return cachedConnection;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    
    if (global.mongoClientPromise) {
      clientPromise = global.mongoClientPromise;
    } else {
      client = new MongoClient(uri);
      clientPromise = client.connect();
      global.mongoClientPromise = clientPromise;
    }
    
    cachedConnection = await clientPromise;
    console.log('✅ Connected to MongoDB successfully');
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error instanceof Error ? error.message : error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default connectToMongoDB;