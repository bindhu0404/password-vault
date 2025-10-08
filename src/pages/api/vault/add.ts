import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/mongodb";
// import { encryptPassword } from "@/utils/crypto"; // optional, if you want backend encryption

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userId, website, username, password, notes } = req.body;

    // ✅ Validate all fields
    if (!userId || !website || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await connectDB();
    const vault = db.collection("vaultItems");

    // Optional: if you want backend encryption instead of client encryption
    // const encryptedPassword = encryptPassword(password);

    await vault.insertOne({
      userId,
      website,
      username,
      notes: notes || "",
      password, // or `encryptedPassword` if encrypting here
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "Vault item added successfully" });
  } catch (error) {
    console.error("Add vault error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
