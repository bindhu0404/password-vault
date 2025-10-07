// src/app/api/auth/signup/route.ts
import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ message: "All fields are required" }, { status: 400 });
    }

    const db = await connectDB();
    const users = db.collection("users");

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return Response.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return Response.json({ message: "User created", userId: result.insertedId });
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ message: "Method not allowed" }, { status: 405 });
}
