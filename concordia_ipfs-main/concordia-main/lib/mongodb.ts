import { MongoClient } from 'mongodb';

// Check if we're running on the server side
const isServer = typeof window === 'undefined';

// Only check for environment variables on the server side
// In development, allow running without a MongoDB instance by falling back to in-memory storage
const isDev = process.env.NODE_ENV !== 'production'
if (isServer && !process.env.MONGODB_URI && !isDev) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Use a safe default for client-side or a proper URI for server-side
const uri = isServer ? (process.env.MONGODB_URI || 'mongodb://localhost:27017/concordia') : '';
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

let cachedConnection: MongoClient | null = null;

// ---------------- In-memory fallback (development) ----------------
type AnyDoc = Record<string, any>

class InMemoryCollection {
  private docs: AnyDoc[]
  private key: string
  constructor(store: Map<string, AnyDoc[]>, name: string) {
    this.key = name
    if (!store.has(name)) store.set(name, [])
    this.docs = store.get(name) as AnyDoc[]
  }
  find(query: AnyDoc = {}) {
    const result = this.docs.filter((d) => Object.entries(query).every(([k, v]) => d[k] === v))
    return {
      toArray: async () => result,
    }
  }
  async findOne(query: AnyDoc = {}) {
    return this.docs.find((d) => Object.entries(query).every(([k, v]) => d[k] === v)) || null
  }
  async insertOne(doc: AnyDoc) {
    this.docs.push(doc)
    return { insertedId: doc.id || doc.groupId || doc._id || undefined }
  }
  async insertMany(docs: AnyDoc[]) {
    this.docs.push(...docs)
    return { insertedCount: docs.length }
  }
  async updateOne(filter: AnyDoc, update: { $set: AnyDoc }, options?: { upsert?: boolean }) {
    let idx = this.docs.findIndex((d) => Object.entries(filter).every(([k, v]) => d[k] === v))
    if (idx >= 0) {
      this.docs[idx] = { ...this.docs[idx], ...(update?.$set || {}) }
      return { matchedCount: 1, modifiedCount: 1, upsertedId: undefined }
    }
    if (options?.upsert) {
      const newDoc = { ...(update?.$set || {}), ...(filter || {}) }
      this.docs.push(newDoc)
      return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc.id || newDoc.groupId }
    }
    return { matchedCount: 0, modifiedCount: 0, upsertedId: undefined }
  }
}

class InMemoryDB {
  private store: Map<string, AnyDoc[]>
  constructor(globalStore: Map<string, AnyDoc[]>) {
    this.store = globalStore
  }
  collection(name: string) {
    return new InMemoryCollection(this.store, name) as any
  }
}

class InMemoryMongoClient {
  private dbInstance: InMemoryDB
  constructor(globalStore: Map<string, AnyDoc[]>) {
    this.dbInstance = new InMemoryDB(globalStore)
  }
  db() {
    return this.dbInstance as any
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __INMEM_DB__: Map<string, AnyDoc[]> | undefined
}

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
    if (isDev) {
      console.warn('⚠️ Falling back to in-memory database (development only)');
      if (!global.__INMEM_DB__) global.__INMEM_DB__ = new Map();
      const memClient = new InMemoryMongoClient(global.__INMEM_DB__);
      // @ts-ignore - treat as MongoClient-like
      cachedConnection = memClient as unknown as MongoClient;
      return cachedConnection;
    }
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default connectToMongoDB;