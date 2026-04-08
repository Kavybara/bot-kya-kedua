"use client";

import { useEffect, useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";

export default function OAuth2CallbackPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [exchangeResult, setExchangeResult] = useState(null);
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authCode = params.get("code");
      const authError = params.get("error");

      if (authError) {
        setError(authError);
      } else if (authCode) {
        setCode(authCode);
      }
    }
  }, []);

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  }

  async function exchangeCode() {
    setExchanging(true);
    setExchangeResult(null);

    try {
      const clientId = prompt("Masukkan GMAIL_CLIENT_ID:");
      const clientSecret = prompt("Masukkan GMAIL_CLIENT_SECRET:");

      if (!clientId || !clientSecret) {
        alert("Client ID dan Secret harus diisi!");
        setExchanging(false);
        return;
      }

      const redirectUri = window.location.origin + "/oauth2callback";

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setExchangeResult({
          success: false,
          error: data.error_description || data.error,
        });
      } else {
        setExchangeResult({
          success: true,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_in: data.expires_in,
        });
      }
    } catch (err) {
      setExchangeResult({
        success: false,
        error: err.message,
      });
    }

    setExchanging(false);
  }

  const redirectUri =
    typeof window !== "undefined"
      ? window.location.origin + "/oauth2callback"
      : "";

  const curlCommand = `curl -X POST https://oauth2.googleapis.com/token \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "code=${code || "YOUR_AUTHORIZATION_CODE"}" \\
  -d "redirect_uri=${redirectUri}" \\
  -d "grant_type=authorization_code"`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">OAuth 2.0 Callback</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                <p className="text-red-300">{error}</p>
                <a
                  href="/gmail-setup"
                  className="text-blue-400 hover:underline mt-4 inline-block"
                >
                  ← Kembali ke Gmail Setup
                </a>
              </div>
            </div>
          </div>
        )}

        {code && (
          <>
            {/* Authorization Code */}
            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl mb-8">
              <div className="flex items-start gap-3">
                <Check size={24} className="text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-green-400 mb-2">
                    Authorization Code Berhasil!
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Kamu sudah dapat authorization code. Sekarang exchange jadi
                    refresh token.
                  </p>
                  <div className="bg-[#0F0F0F] p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        Authorization Code:
                      </span>
                      <button
                        onClick={() => copyToClipboard(code, "code")}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm"
                      >
                        {copied === "code" ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copied === "code" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <code className="text-sm break-all block">{code}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Method 1: Automatic Exchange */}
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A] mb-8">
              <h2 className="text-2xl font-bold mb-4">
                📱 Method 1: Exchange Otomatis
              </h2>
              <p className="text-gray-400 mb-6">
                Klik tombol di bawah, masukkan Client ID dan Secret, dan sistem
                akan otomatis exchange code-nya.
              </p>
              <button
                onClick={exchangeCode}
                disabled={exchanging}
                className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {exchanging ? "Exchanging..." : "Exchange Code Sekarang"}
              </button>

              {exchangeResult && (
                <div
                  className={`mt-6 p-4 rounded-lg border ${
                    exchangeResult.success
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  {exchangeResult.success ? (
                    <div>
                      <h3 className="text-lg font-bold text-green-400 mb-3">
                        ✓ Berhasil!
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-400">
                              Refresh Token:
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  exchangeResult.refresh_token,
                                  "refresh",
                                )
                              }
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm"
                            >
                              {copied === "refresh" ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copied === "refresh" ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <code className="text-sm break-all block bg-[#0F0F0F] p-3 rounded">
                            {exchangeResult.refresh_token}
                          </code>
                        </div>
                        <p className="text-sm text-green-300 bg-green-500/10 p-3 rounded">
                          ✅ Copy refresh token di atas dan set sebagai{" "}
                          <strong>GMAIL_REFRESH_TOKEN</strong> di environment
                          variables
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-red-400 mb-2">
                        ✗ Gagal
                      </h3>
                      <p className="text-red-300">{exchangeResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Method 2: Manual curl */}
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
              <h2 className="text-2xl font-bold mb-4">
                💻 Method 2: Manual dengan curl
              </h2>
              <p className="text-gray-400 mb-6">
                Atau exchange secara manual menggunakan curl command:
              </p>

              <div className="space-y-4">
                {/* Step 1 */}
                <div>
                  <h3 className="font-semibold mb-2 text-lg">
                    1. Ganti placeholder dengan credentials kamu:
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mb-3">
                    <li>
                      <code className="text-blue-400">YOUR_CLIENT_ID</code> →
                      Client ID dari Google Cloud Console
                    </li>
                    <li>
                      <code className="text-blue-400">YOUR_CLIENT_SECRET</code>{" "}
                      → Client Secret dari Google Cloud Console
                    </li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="bg-[#0F0F0F] p-4 rounded-lg relative">
                    <button
                      onClick={() => copyToClipboard(curlCommand, "curl")}
                      className="absolute top-3 right-3 text-blue-400 hover:text-blue-300"
                    >
                      {copied === "curl" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <pre className="text-xs overflow-x-auto pr-8">
                      <code>{curlCommand}</code>
                    </pre>
                  </div>
                </div>

                {/* Step 3 */}
                <div>
                  <h3 className="font-semibold mb-2 text-lg">
                    3. Response akan seperti ini:
                  </h3>
                  <div className="bg-[#0F0F0F] p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      <code>{`{
  "access_token": "ya29.a0AfH6...",
  "expires_in": 3599,
  "refresh_token": "1//0g...",  ← Copy yang ini!
  "scope": "https://www.googleapis.com/auth/gmail.readonly",
  "token_type": "Bearer"
}`}</code>
                    </pre>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-lg text-yellow-400">
                    4. Set Environment Variable:
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">
                    Copy <code className="text-blue-400">refresh_token</code>{" "}
                    dari response dan set sebagai environment variable:
                  </p>
                  <code className="text-sm block bg-[#0F0F0F] p-3 rounded">
                    GMAIL_REFRESH_TOKEN=your_refresh_token_here
                  </code>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-500/20">
              <h3 className="text-xl font-bold mb-3">
                🎯 Setelah dapat Refresh Token:
              </h3>
              <ol className="space-y-2 text-gray-300">
                <li>
                  1. Set semua environment variables (CLIENT_ID, CLIENT_SECRET,
                  REFRESH_TOKEN)
                </li>
                <li>2. Restart aplikasi</li>
                <li>
                  3. Test connection di{" "}
                  <a
                    href="/gmail-setup"
                    className="text-blue-400 hover:underline"
                  >
                    /gmail-setup
                  </a>
                </li>
                <li>4. Kalau berhasil, bot sudah siap digunakan! 🚀</li>
              </ol>
            </div>
          </>
        )}

        {!code && !error && (
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <p className="text-gray-400 mb-4">
              Halaman ini akan menangkap authorization code dari Google OAuth
              redirect.
            </p>
            <p className="text-gray-400">
              Kembali ke{" "}
              <a href="/gmail-setup" className="text-blue-400 hover:underline">
                Gmail Setup
              </a>{" "}
              untuk memulai proses OAuth.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
