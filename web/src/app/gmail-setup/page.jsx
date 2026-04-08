"use client";

import { useState } from "react";
import { Check, Copy, AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function GmailSetupPage() {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState("");

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/gmail/test");
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
    setTesting(false);
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  }

  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/oauth2callback`
      : "http://localhost:3000/oauth2callback";

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Gmail OAuth Setup</h1>
          <p className="text-xl text-gray-400">
            Setup Gmail API access untuk Netflix Bot
          </p>
        </div>

        {/* Test Connection */}
        <div className="mb-8 bg-[#1A1A1A] p-6 rounded-2xl border border-[#2A2A2A]">
          <h2 className="text-xl font-bold mb-4">🔌 Test Connection</h2>
          <p className="text-gray-400 mb-4">
            Test apakah Gmail OAuth credentials sudah bekerja dengan benar
          </p>
          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={testing}
              className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {testing && <Loader size={16} className="animate-spin" />}
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <a
              href="/api/gmail/debug-oauth"
              target="_blank"
              className="bg-[#2A2A2A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#3A3A3A] transition-colors flex items-center gap-2"
            >
              🔍 Detailed Debug
            </a>
          </div>

          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                testResult.success
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle
                    size={20}
                    className="text-green-400 flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <AlertCircle
                    size={20}
                    className="text-red-400 flex-shrink-0 mt-0.5"
                  />
                )}
                <div className="flex-1">
                  <p
                    className={`font-semibold mb-1 ${testResult.success ? "text-green-400" : "text-red-400"}`}
                  >
                    {testResult.success
                      ? "✓ Connection Successful!"
                      : "✗ Connection Failed"}
                  </p>
                  {testResult.message && (
                    <p className="text-sm text-gray-300 mb-2">
                      {testResult.message}
                    </p>
                  )}
                  {testResult.error && (
                    <p className="text-sm text-red-300 mb-2">
                      Error: {testResult.error}
                    </p>
                  )}
                  {testResult.step && (
                    <p className="text-sm text-yellow-300 mt-2">
                      📝 Next step: {testResult.step}
                    </p>
                  )}
                  {!testResult.success && (
                    <p className="text-sm text-gray-400 mt-3">
                      💡 Klik <strong>"Detailed Debug"</strong> di atas untuk
                      lihat error lengkap step-by-step
                    </p>
                  )}
                  {testResult.info && (
                    <div className="mt-2 text-sm text-gray-400">
                      <p>
                        • Netflix emails found:{" "}
                        {testResult.info.hasMessages ? "Yes" : "No"}
                      </p>
                      <p>• Total messages: {testResult.info.messageCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Setup Steps */}
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="flex items-start gap-4">
              <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">
                  Create Google Cloud Project
                </h2>
                <ol className="space-y-3 text-gray-300">
                  <li>
                    1. Buka{" "}
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      className="text-blue-400 hover:underline"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>
                    2. Klik "Create Project" atau pilih project yang sudah ada
                  </li>
                  <li>3. Beri nama project (contoh: "Netflix Bot")</li>
                  <li>4. Klik "Create"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="flex items-start gap-4">
              <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Enable Gmail API</h2>
                <ol className="space-y-3 text-gray-300">
                  <li>1. Di Google Cloud Console, pilih project kamu</li>
                  <li>2. Buka "APIs & Services" → "Library"</li>
                  <li>3. Cari "Gmail API"</li>
                  <li>4. Klik "Enable"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="flex items-start gap-4">
              <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">
                  Create OAuth Credentials
                </h2>
                <ol className="space-y-3 text-gray-300">
                  <li>1. Buka "APIs & Services" → "Credentials"</li>
                  <li>2. Klik "Create Credentials" → "OAuth client ID"</li>
                  <li>
                    3. Pilih application type:{" "}
                    <strong className="text-white">"Web application"</strong>
                  </li>
                  <li>4. Beri nama (contoh: "Netflix Bot OAuth")</li>
                  <li>
                    5. Tambahkan Authorized redirect URI:
                    <div className="bg-[#0F0F0F] p-3 rounded-lg mt-2 flex items-center justify-between">
                      <code className="text-sm break-all">{redirectUri}</code>
                      <button
                        onClick={() => copyToClipboard(redirectUri, "redirect")}
                        className="text-blue-400 hover:text-blue-300 ml-2 flex-shrink-0"
                      >
                        {copied === "redirect" ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </li>
                  <li>6. Klik "Create"</li>
                  <li>
                    7. Simpan <strong className="text-white">Client ID</strong>{" "}
                    dan <strong className="text-white">Client Secret</strong>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="flex items-start gap-4">
              <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Get Refresh Token</h2>
                <ol className="space-y-3 text-gray-300">
                  <li>
                    1. Ganti{" "}
                    <code className="text-blue-400">YOUR_CLIENT_ID</code> dengan
                    Client ID kamu di URL ini:
                    <div className="bg-[#0F0F0F] p-3 rounded-lg mt-2">
                      <code className="text-xs break-all block">{authUrl}</code>
                    </div>
                  </li>
                  <li>2. Buka URL tersebut di browser</li>
                  <li>3. Login dengan akun Gmail yang punya email Netflix</li>
                  <li>4. Allow akses yang diminta</li>
                  <li>
                    5. Setelah redirect, kamu akan dapat{" "}
                    <strong className="text-white">authorization code</strong>{" "}
                    di URL
                  </li>
                  <li>
                    6. Exchange code tersebut jadi refresh token dengan curl:
                    <div className="bg-[#0F0F0F] p-3 rounded-lg mt-2 overflow-x-auto">
                      <code className="text-xs block whitespace-pre">
                        {`curl -X POST https://oauth2.googleapis.com/token \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "code=YOUR_AUTHORIZATION_CODE" \\
  -d "redirect_uri=${redirectUri}" \\
  -d "grant_type=authorization_code"`}
                      </code>
                    </div>
                  </li>
                  <li>
                    7. Response akan berisi{" "}
                    <strong className="text-white">refresh_token</strong>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="flex items-start gap-4">
              <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">
                  Set Environment Variables
                </h2>
                <p className="text-gray-300 mb-4">
                  Tambahkan credentials ke environment variables:
                </p>
                <div className="bg-[#0F0F0F] p-4 rounded-lg font-mono text-sm space-y-2">
                  <div>
                    GMAIL_CLIENT_ID=
                    <span className="text-yellow-400">your_client_id</span>
                  </div>
                  <div>
                    GMAIL_CLIENT_SECRET=
                    <span className="text-yellow-400">your_client_secret</span>
                  </div>
                  <div>
                    GMAIL_REFRESH_TOKEN=
                    <span className="text-yellow-400">your_refresh_token</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  ⚠️ Setelah set environment variables, restart aplikasi dan test
                  connection di atas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative: OAuth Playground */}
        <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-500/20">
          <h3 className="text-xl font-bold mb-3">
            💡 Cara Mudah: Google OAuth Playground
          </h3>
          <p className="text-gray-300 mb-4">
            Gunakan Google OAuth 2.0 Playground untuk dapat refresh token dengan
            lebih mudah:
          </p>
          <ol className="space-y-2 text-gray-300 text-sm">
            <li>
              1. Buka{" "}
              <a
                href="https://developers.google.com/oauthplayground"
                target="_blank"
                className="text-blue-400 hover:underline"
              >
                OAuth 2.0 Playground
              </a>
            </li>
            <li>2. Klik ⚙️ (Settings) di kanan atas</li>
            <li>3. Centang "Use your own OAuth credentials"</li>
            <li>4. Masukkan Client ID dan Client Secret kamu</li>
            <li>
              5. Di Step 1, pilih "Gmail API v1" →{" "}
              <code className="text-blue-400">
                https://www.googleapis.com/auth/gmail.readonly
              </code>
            </li>
            <li>6. Klik "Authorize APIs" dan login</li>
            <li>7. Di Step 2, klik "Exchange authorization code for tokens"</li>
            <li>
              8. Copy <strong className="text-white">Refresh token</strong>
            </li>
          </ol>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a
            href="/setup"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Setup Guide
          </a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
