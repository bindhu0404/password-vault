// src/lib/mongodb.ts
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, reuse connection to avoid multiple clients
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri!, options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production, always create a new client
  client = new MongoClient(uri!, options);
  clientPromise = client.connect();
}

// ✅ Function to get the DB instance
export async function connectDB() {
  const client = await clientPromise;
  return client.db("passwordVault"); // <-- you can rename this DB name if you want
}

export default clientPromise;
