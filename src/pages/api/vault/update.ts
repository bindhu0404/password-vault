// src/pages/api/vault/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id, website, username, password, notes } = req.body;

    if (!id || !website || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = await connectDB();
    const vault = db.collection("vaultItems");

    const result = await vault.updateOne(
      { _id: typeof id === "string" ? new (require("mongodb").ObjectId)(id) : id },
      {
        $set: {
          website,
          username,
          password, // ciphertext from client
          notes: notes || "",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json({ message: "Updated" });
  } catch (error) {
    console.error("Update vault error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
