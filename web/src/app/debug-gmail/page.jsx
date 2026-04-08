"use client";

import { useState } from "react";

export default function DebugGmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/gmail/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_email: email,
          max_age_seconds: 1800, // 30 menit
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Gmail Debug Tool</h1>

        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Email Address:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pandsky@vya.baby"
            className="w-full bg-[#0A0A0A] border border-[#333] rounded px-4 py-3 mb-4"
          />

          <button
            onClick={handleTest}
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded px-6 py-3 font-medium transition-colors"
          >
            {loading ? "🔍 Searching..." : "🔍 Search Email"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-2">❌ Error</h2>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Parsed Data */}
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">✅ Parsed Data</h2>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Subject:</span>
                  <p className="text-white font-mono text-sm mt-1">
                    {result.data.subject || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">From:</span>
                  <p className="text-white font-mono text-sm mt-1">
                    {result.data.from || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Date:</span>
                  <p className="text-white font-mono text-sm mt-1">
                    {result.data.date || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Sign-In Code:</span>
                  <p className="text-white font-mono text-lg mt-1 font-bold">
                    {result.data.sign_in_code || "❌ NOT FOUND"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Reset Link:</span>
                  <p className="text-white font-mono text-sm mt-1 break-all">
                    {result.data.reset_link || "❌ NOT FOUND"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Household Link:</span>
                  <p className="text-white font-mono text-sm mt-1 break-all">
                    {result.data.household_link || "❌ NOT FOUND"}
                  </p>
                </div>
              </div>
            </div>

            {/* Raw Email Body */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📧 Raw Email Body</h2>
              <div className="bg-[#0A0A0A] rounded p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {result.raw_body || "No body content"}
                </pre>
              </div>
            </div>

            {/* All Matches */}
            {result.debug_matches && (
              <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">🔍 Debug Matches</h2>
                <pre className="text-xs text-purple-200 whitespace-pre-wrap font-mono">
                  {JSON.stringify(result.debug_matches, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
