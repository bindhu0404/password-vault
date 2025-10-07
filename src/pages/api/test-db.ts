import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("passwordVault");// our DB name
    const collections = await db.listCollections().toArray();
    res.status(200).json({ message: "Connected!", collections });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database connection failed" });
  }
}
