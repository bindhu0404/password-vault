# Password Generator + Secure Vault (MVP)

A simple, privacy-first password manager built with **Next.js**, **TypeScript**, and **MongoDB**, featuring a strong password generator, encrypted storage, and smooth user experience.  
This project fulfills the *Password Generator + Secure Vault* assignment requirements.

---

## Live Demo



---

## Overview
This web app lets users:
- **Generate strong passwords** with custom options (length, symbols, numbers, uppercase, lowercase, exclude lookalikes)
- **Save credentials securely** in a personal encrypted vault
- **View, edit, and delete** stored entries
- **Search/filter** credentials easily
- **Copy passwords to clipboard** (auto-clears after 12 seconds)
- **Keep data private** with client-side AES encryption — plaintext is never stored on the server.

---

## Features
Password generator with:
- Adjustable length (6–32)
- Checkboxes for lowercase / uppercase / numbers / symbols  
- Option to exclude look-alike characters (O, 0, I, l)  
- Instant password fill-in on generation  

Secure vault:
- Add, edit, delete credentials  
- Each entry includes **Website**, **Username**, **Password**, and **Notes**  
- Passwords encrypted on client using user-specific key  

Extra:
- Password strength meter  
- Copy-to-clipboard with auto-clear (~12s)  
- Search by website, username, or notes  
- Modern dark gradient UI with responsive layout  
- Logout & session storage handling  

---

## Tech Stack
| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js (React, TypeScript, TailwindCSS) |
| **Backend** | Next.js API Routes |
| **Database** | MongoDB |
| **Encryption** | AES encryption via `crypto-js` |
| **Icons & UI** | Lucide-react, React Hot Toast |

---

## Crypto Implementation
Each password is encrypted **client-side** using the logged-in user's unique ID as the passphrase before being sent to the server.

- **Library Used:** `crypto-js`
- **Why:** Lightweight, fast, and reliable for AES encryption/decryption
- **Result:** The server and database never store or see any plaintext credentials — only encrypted ciphertext strings.

