const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

let cached = global._mongo;

if (!cached) {
  cached = global._mongo = { client: null, clientPromise: null };
}

async function getClient() {
  if (cached.client) return cached.client;
  if (!cached.clientPromise) {
    cached.clientPromise = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    })
      .connect()
      .then((client) => {
        cached.client = client;
        return client;
      });
  }
  return cached.clientPromise;
}

async function getCollection() {
  const client = await getClient();
  const dbName = process.env.MONGODB_DB || 'project_api';
  const collectionName = process.env.MONGODB_PRODUCTS_COLLECTION || 'products';
  return client.db(dbName).collection(collectionName);
}

module.exports = { getCollection };