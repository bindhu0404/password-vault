// src/pages/vault.tsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Eye, EyeOff, Copy, Trash2, LogOut, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import { encryptWithPassphrase, decryptWithPassphrase } from "@/utils/cryptoClient";

type VaultItem = {
  _id: string;
  userId?: string;
  website: string;
  username: string;
  password: string; // decrypted in UI
  notes?: string;
  createdAt?: string;
};

export default function VaultPage(){
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [strength, setStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // password generator settings
  const [genLength, setGenLength] = useState(12);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeLookalikes, setExcludeLookalikes] = useState(false);

  // clipboard timer ref so we can clear if component unmounts
  const clipboardTimerRef = useRef<number | null>(null);
  const copiedIdRef = useRef<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // load user from localStorage
    const s = localStorage.getItem("user");
    if (!s) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(s);
    setUser(parsed);
  }, [router]);

  // password strength
  function calcStrength(pw: string) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0..4
  }

  useEffect(() => {
    setStrength(calcStrength(password));
  }, [password]);

  // fetch vault items (ciphertext from server, decrypt on client)
  const fetchVaultItems = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/vault/get?userId=${user.id}`);
      const serverItems: any[] = res.data || [];
      const decrypted = await Promise.all(
        serverItems.map(async (it) => {
          // server sends password as ciphertext; decrypt with user.id
          try {
            const plain = await decryptWithPassphrase(it.password, user.id);
            return { ...it, password: plain };
          } catch (err) {
            // keep a readable message instead of crashing
            console.error("Decrypt failed for item", it._id, err);
            return { ...it, password: "[decryption failed]" };
          }
        })
      );
      setItems(decrypted);
    } catch (err) {
      console.error("Fetch vault items error", err);
      toast.error("Failed to load vault items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchVaultItems();
    // cleanup clipboard timer on unmount
    return () => {
      if (clipboardTimerRef.current) {
        window.clearTimeout(clipboardTimerRef.current);
        clipboardTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // add or update entry
  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return router.push("/login");

    if (!website || !username || !password) {
      toast.error("Please fill website, username and password");
      return;
    }

    try {
      const encrypted = await encryptWithPassphrase(password, user.id);

      if (editingId) {
        // update
        await axios.put("/api/vault/update", {
          id: editingId,
          website,
          username,
          password: encrypted,
          notes,
        });
        toast.success("Updated credential");
        setEditingId(null);
      } else {
        await axios.post("/api/vault/add", {
          userId: user.id,
          website,
          username,
          password: encrypted,
          notes,
        });
        toast.success("Added credential (encrypted)");
      }

      // clear form
      setWebsite("");
      setUsername("");
      setPassword("");
      setNotes("");
      // refresh
      fetchVaultItems();
    } catch (err) {
      console.error("Save error", err);
      toast.error("Error saving credential");
    }
  };

  // edit: populate form with decrypted values (items are already decrypted)
  const handleEdit = (item: VaultItem) => {
    setEditingId(item._id);
    setWebsite(item.website);
    setUsername(item.username);
    setPassword(item.password);
    setNotes(item.notes || "");
    // bring form into view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`/api/vault/delete?id=${id}`);
      toast.success("Deleted");
      fetchVaultItems();
    } catch (err) {
      console.error("Delete error", err);
      toast.error("Delete failed");
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((p) => ({ ...p, [id]: !p[id] }));
  };

  // copy + auto-clear
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      copiedIdRef.current = id;
      toast.success("Copied to clipboard");

      // clear old timer if any
      if (clipboardTimerRef.current) {
        window.clearTimeout(clipboardTimerRef.current);
      }
      // clear clipboard after 12 seconds (assignment asked 10-20s)
      clipboardTimerRef.current = window.setTimeout(async () => {
        try {
          // attempt to clear clipboard (may be restricted by browser)
          await navigator.clipboard.writeText("");
        } catch (err) {
          // ignore - some browsers block programmatic clearing after a non-user gesture
        }
        setCopiedId(null);
        copiedIdRef.current = null;
        toast("Clipboard cleared");
        clipboardTimerRef.current = null;
      }, 12000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
      toast.error("Copy failed");
    }
  };

  // password generator
  const generatePassword = () => {
    let chars = "";
    if (includeLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (includeUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) chars += "0123456789";
    if (includeSymbols) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (excludeLookalikes) {
      // remove characters often confused
      chars = chars.replace(/[O0Il1]/g, "");
    }

    if (!chars) {
      toast.error("Select at least one character set for generator");
      return;
    }
    let out = "";
    for (let i = 0; i < genLength; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(out);
    toast.success("Generated password");
  };

  // filtered list based on search
  const filteredItems = items.filter((it) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (it.website && it.website.toLowerCase().includes(q)) ||
      (it.username && it.username.toLowerCase().includes(q)) ||
      (it.notes && it.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Password Vault</h1>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Generator */}
        <div className="bg-gray-800/70 p-4 rounded-xl mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Password Generator</h2>
            <div className="text-sm text-gray-300">Length: {genLength}</div>
          </div>

          <input
            type="range"
            min={6}
            max={32}
            value={genLength}
            onChange={(e) => setGenLength(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
              />
              Lowercase
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
              />
              Uppercase
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
              />
              Numbers
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
              />
              Symbols
            </label>
            <label className="col-span-2 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={excludeLookalikes}
                onChange={(e) => setExcludeLookalikes(e.target.checked)}
              />
              Exclude lookalikes (0, O, l, I)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generatePassword}
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold"
            >
              Generate Password
            </button>
            <button
              onClick={() => {
                setPassword("");
                toast("Cleared generator output");
              }}
              type="button"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Add / Edit form */}
        <form onSubmit={handleAddOrUpdate} className="bg-gray-800/70 p-6 rounded-xl shadow-md space-y-4 mb-8">
          <h2 className="text-xl font-semibold mb-2">{editingId ? "Edit Credential" : "Add New Credential"}</h2>

          <input
            type="text"
            placeholder="Enter website (e.g. facebook.com)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full p-2 rounded bg-gray-900 text-white placeholder-gray-400"
            autoComplete="off"
            required
          />

          <input
            type="text"
            placeholder="Enter username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded bg-gray-900 text-white placeholder-gray-400"
            autoComplete="off"
            required
          />

          <div>
            <input
              type="text"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white placeholder-gray-400 mb-2"
              autoComplete="new-password"
              required
            />

            {/* Strength */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  style={{ width: `${(strength / 4) * 100}%` }}
                  className={`h-full transition-all ${strength <= 1 ? "bg-red-500" : strength === 2 ? "bg-yellow-400" : "bg-green-500"}`}
                />
              </div>
              <span className="text-sm text-gray-300 w-28 text-right">
                {strength === 0 && "Very weak"}
                {strength === 1 && "Weak"}
                {strength === 2 && "Fair"}
                {strength === 3 && "Strong"}
                {strength === 4 && "Very strong"}
              </span>
            </div>
          </div>

          <textarea
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 rounded bg-gray-900 text-white placeholder-gray-400"
            rows={3}
          />

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-lg py-2 font-semibold">
            {editingId ? "Save Changes" : "Add (Encrypted)"}
          </button>
        </form>

        {/* Search */}
<div className="relative mb-6">
  <input
    type="text"
    placeholder="Search by website, username or notes..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full p-2 pl-10 rounded bg-gray-900 text-white placeholder-gray-400"
    autoComplete="off"
  />
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1011.25 18a7.5 7.5 0 005.4-2.35z" />
  </svg>
</div>


        {/* Vault list */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-400">No saved credentials found.</p>
          ) : (
            filteredItems.map((item) => (
              <div key={item._id} className="bg-gray-800/70 p-4 rounded-lg flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg break-words">{item.website}</h3>
                  <p className="text-sm text-gray-300 truncate">Username: {item.username}</p>
                  <p className="text-sm text-gray-400 truncate">Notes: {item.notes || "—"}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-gray-300">
                      Password:{" "}
                      {visiblePasswords[item._id] ? item.password : "•".repeat(Math.max(6, item.password.length))}
                    </p>

                    <button
                      onClick={() => togglePasswordVisibility(item._id)}
                      className="text-indigo-400 hover:text-white"
                      type="button"
                      aria-label="Toggle password visibility"
                    >
                      {visiblePasswords[item._id] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    <button
                      onClick={() => copyToClipboard(item.password, item._id)}
                      className="text-indigo-400 hover:text-white"
                      type="button"
                      aria-label="Copy password"
                    >
                      {copiedId === item._id ? <span className="text-sm">Copied!</span> : <Copy size={18} />}
                    </button>

                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-400 hover:text-white"
                      type="button"
                      aria-label="Edit"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
