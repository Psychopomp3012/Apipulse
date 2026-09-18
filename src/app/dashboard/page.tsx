"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Key, Activity, Copy, Check, Trash2 } from "lucide-react";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: any;
  expiresAt?: any;
  usageCount?: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("0");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const token = localStorage.getItem("apipulse_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Immediately fetch keys since we have the token
    fetchApiKeys().then(() => setLoading(false));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem("apipulse_token");
      if (!token) return;
      const res = await fetch("http://localhost:8080/api/apipulse/keys", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Fallback for backwards compatibility if backend still returns array (while deploying)
        if (Array.isArray(data)) {
          setApiKeys(data);
          setTotalUsage(data.reduce((acc, key) => acc + (key.usageCount || 0), 0));
        } else {
          setApiKeys(data.keys);
          setTotalUsage(data.totalUsage);
        }
      }
    } catch (err) {
      console.warn("Error fetching API keys. Ensure backend is running.", err);
      window.dispatchEvent(new Event("server-offline"));
    }
  };

  const generateApiKey = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("apipulse_token");
      if (!token) return;
      
      const res = await fetch("http://localhost:8080/api/apipulse/keys/generate", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays: parseInt(newKeyExpiry, 10)
        })
      });
      if (res.ok) {
        const newKey = await res.json();
        setApiKeys([...apiKeys, newKey]);
        setShowGenerateModal(false);
        setNewKeyName("");
        setNewKeyExpiry("0");
      }
    } catch (err) {
      console.warn("Error generating API key. Ensure backend is running.", err);
      window.dispatchEvent(new Event("server-offline"));
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Never";
    // Check if it's a Firestore Timestamp (has seconds) or an ISO string
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB');
    }
    return new Date(timestamp).toLocaleDateString('en-GB');
  };

  const deleteApiKey = async (id: string) => {
    try {
      const token = localStorage.getItem("apipulse_token");
      if (!token) return;
      const res = await fetch(`http://localhost:8080/api/apipulse/keys/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchApiKeys();
      }
    } catch (err) {
      console.warn("Error deleting API key.", err);
      window.dispatchEvent(new Event("server-offline"));
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-primary font-bold">
          <Activity className="h-6 w-6 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const planLimit = 1000;

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="group min-h-[calc(100vh-4rem)] pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative"
    >
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 hidden dark:block opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.15), transparent 40%)`
        }}
      />
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Developer Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Welcome back, {user?.displayName || user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="glass p-8 rounded-3xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">API Keys</h2>
          </div>
          
          <div className="flex-1 mb-6 overflow-x-auto max-h-[400px] overflow-y-auto pr-2">
            {apiKeys.length === 0 ? (
              <p className="text-gray-500">You don't have any active API keys yet.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-gray-500 text-sm">
                    <th className="pb-3 font-medium px-2">Name</th>
                    <th className="pb-3 font-medium px-2">Secret Key</th>
                    <th className="pb-3 font-medium px-2">Created</th>
                    <th className="pb-3 font-medium px-2">Expires</th>
                    <th className="pb-3 font-medium px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(apiKey => (
                    <tr key={apiKey.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2 font-medium max-w-[150px] truncate" title={apiKey.name}>
                        {apiKey.name}
                      </td>
                      <td className="py-4 px-2">
                        <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">
                          {apiKey.key.substring(0, 15)}...
                        </code>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-500">{formatDate(apiKey.createdAt)}</td>
                      <td className="py-4 px-2 text-sm text-gray-500">{formatDate(apiKey.expiresAt)}</td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Copy full key"
                          >
                            {copiedKey === apiKey.key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
                          </button>
                          <button 
                            onClick={() => setKeyToDelete(apiKey.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button 
            onClick={() => setShowGenerateModal(true)}
            disabled={apiKeys.length >= 10}
            title={apiKeys.length >= 10 ? "Maximum limit of 10 active keys reached." : ""}
            className={`w-full py-3 font-medium rounded-xl transition-all duration-300 select-none mt-auto ${
              apiKeys.length >= 10 
                ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700" 
                : "bg-gradient-to-r from-blue-600/60 to-indigo-600/60 backdrop-blur-md text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_20px_-10px_rgba(59,130,246,0.3)] dark:border-white/30 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_10px_20px_-10px_rgba(59,130,246,0.5)] hover:from-blue-600/80 hover:to-indigo-600/80 hover:scale-[1.02] cursor-pointer"
            }`}
          >
            {apiKeys.length >= 10 ? "Key Limit Reached (Max 10)" : "Generate New Key"}
          </button>
        </div>

        <div className="glass p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold">Credit Usage</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
              <span className="text-gray-500 whitespace-nowrap">Credits (This Month)</span>
              <div className="flex-1 h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (totalUsage / planLimit) > 0.85 ? 'bg-red-500' : 
                    (totalUsage / planLimit) > 0.50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.max(0, 100 - (totalUsage / planLimit) * 100)}%` }}
                ></div>
              </div>
              <span className="font-bold whitespace-nowrap">{(Math.max(0, planLimit - totalUsage)).toLocaleString()} / {planLimit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Current Plan</span>
              <span className="font-bold text-primary">Hobby (Free)</span>
            </div>
          </div>
        </div>
      </div>

      {keyToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-black/10 dark:border-white/10">
            <h3 className="text-xl font-bold mb-4">Delete API Key?</h3>
            <p className="text-gray-500 mb-8">Are you sure you want to delete this key? Any applications using it will immediately lose access. This action cannot be undone.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setKeyToDelete(null)} 
                className="flex-1 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl font-medium transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button 
                onClick={() => { deleteApiKey(keyToDelete); setKeyToDelete(null); }} 
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors cursor-pointer select-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#09090b] p-8 rounded-3xl max-w-md w-full shadow-2xl border border-black/10 dark:border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,45%,rgba(59,130,246,0.05),55%,transparent)] animate-shimmer pointer-events-none" />
            <h3 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Generate API Key
            </h3>
            
            <div className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Production_Scraper"
                  value={newKeyName}
                  maxLength={50}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z0-9_]*$/.test(val)) {
                      setNewKeyName(val);
                    }
                  }}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration
                </label>
                <select 
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="0">No expiration</option>
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-8 relative z-10">
              <button 
                onClick={() => setShowGenerateModal(false)} 
                className="flex-1 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl font-medium transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button 
                onClick={generateApiKey}
                disabled={generating || newKeyName.trim().length < 3}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors cursor-pointer select-none disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? <Activity className="h-4 w-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
