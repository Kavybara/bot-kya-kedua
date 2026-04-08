"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

export default function SetupPage() {
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/telegram/webhook`;

  async function setupWebhook() {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/setup");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWebhookStatus(data);
    } catch (error) {
      setWebhookStatus({ success: false, error: error.message });
    }
    setLoading(false);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Setup Guide</h1>
          <p className="text-xl text-gray-400">
            Configure your Netflix Telegram Bot in 3 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="flex items-start gap-4">
              <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">
                  Environment Variables
                </h2>
                <p className="text-gray-400 mb-4">
                  Make sure these environment variables are set:
                </p>
                <div className="bg-[#0F0F0F] p-4 rounded-lg font-mono text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <code>TELEGRAM_BOT_TOKEN</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <code>GMAIL_CLIENT_ID</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <code>GMAIL_CLIENT_SECRET</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <code>GMAIL_REFRESH_TOKEN</code>
                  </div>
                </div>
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
                <h2 className="text-2xl font-bold mb-4">
                  Setup Telegram Webhook
                </h2>
                <p className="text-gray-400 mb-4">
                  Configure your Telegram bot to receive updates via webhook:
                </p>

                <div className="bg-[#0F0F0F] p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Webhook URL:</span>
                    <button
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <code className="text-sm break-all">{webhookUrl}</code>
                </div>

                <button
                  onClick={setupWebhook}
                  disabled={loading}
                  className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {loading ? "Setting up..." : "Setup Webhook Automatically"}
                </button>

                {webhookStatus && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      webhookStatus.success
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <p
                      className={
                        webhookStatus.success
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {webhookStatus.success
                        ? "✓ Webhook configured successfully!"
                        : `✗ Error: ${webhookStatus.error}`}
                    </p>
                  </div>
                )}
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
                <h2 className="text-2xl font-bold mb-4">Add Users</h2>
                <p className="text-gray-400 mb-4">
                  Go to the dashboard to add authorized users and set their
                  permissions:
                </p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Open Dashboard
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bot Commands Reference */}
        <div className="mt-12 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] p-8 rounded-2xl border border-[#2A2A2A]">
          <h2 className="text-2xl font-bold mb-6">Bot Commands</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#0F0F0F] p-4 rounded-lg">
              <code className="text-blue-400">/start</code>
              <p className="text-sm text-gray-400 mt-2">
                Start the bot and see main menu
              </p>
            </div>
            <div className="bg-[#0F0F0F] p-4 rounded-lg">
              <code className="text-blue-400">/code</code>
              <p className="text-sm text-gray-400 mt-2">
                Get Netflix sign-in code
              </p>
            </div>
            <div className="bg-[#0F0F0F] p-4 rounded-lg">
              <code className="text-blue-400">/reset</code>
              <p className="text-sm text-gray-400 mt-2">
                Get password reset link
              </p>
            </div>
            <div className="bg-[#0F0F0F] p-4 rounded-lg">
              <code className="text-blue-400">/household</code>
              <p className="text-sm text-gray-400 mt-2">
                Get household management link
              </p>
            </div>
            <div className="bg-[#0F0F0F] p-4 rounded-lg">
              <code className="text-blue-400">/mypins</code>
              <p className="text-sm text-gray-400 mt-2">
                View saved Netflix PINs
              </p>
            </div>
            <div className="bg-[#0F0F0F] p-4 rounded-lg">
              <code className="text-blue-400">/help</code>
              <p className="text-sm text-gray-400 mt-2">Show help message</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
