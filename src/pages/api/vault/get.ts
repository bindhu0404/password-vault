import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "Missing or invalid userId" });
    }

    const db = await connectDB();
    const vault = db.collection("vaultItems");

    // Return encrypted items directly (no decryption here)
    const items = await vault.find({ userId }).toArray();

    return res.status(200).json(items);
  } catch (error) {
    console.error("Vault fetch error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
