// src/models/VaultItem.ts
export interface VaultItem {
  _id?: string;
  userId: string;        // To link each vault item to a user
  title: string;         // e.g., "Gmail"
  username: string;      // e.g., "user@gmail.com"
  password: string;      // Encrypted password
  createdAt?: Date;
}
