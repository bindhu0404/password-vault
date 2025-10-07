import crypto from "crypto";

const ALGORITHM = "aes-256-ctr";
const SECRET_KEY = process.env.CRYPTO_KEY || "mystrongkeyforvault1234567890123"; // 32 chars
const IV = crypto.randomBytes(16);

export function encryptPassword(password: string) {
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), IV);
  const encrypted = Buffer.concat([cipher.update(password), cipher.final()]);
  return `${IV.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPassword(hash: string) {
  const [iv, encryptedData] = hash.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY),
    Buffer.from(iv, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
}
