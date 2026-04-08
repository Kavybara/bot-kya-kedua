export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">🎬 Netflix Bot</h1>
          <p className="text-xl text-gray-400">
            Automated Netflix Email Parser & Telegram Bot
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-xl font-bold mb-2">Sign-In Code</h3>
            <p className="text-gray-400">
              Automatically extract sign-in codes from Netflix emails
            </p>
          </div>

          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold mb-2">Reset Password</h3>
            <p className="text-gray-400">
              Get password reset links instantly from your inbox
            </p>
          </div>

          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#2A2A2A]">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold mb-2">Household Links</h3>
            <p className="text-gray-400">
              Extract household management links automatically
            </p>
          </div>
        </div>

        {/* Admin Features */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] p-8 rounded-2xl border border-[#2A2A2A] mb-16">
          <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-300">
                👥 User Management
              </h4>
              <p className="text-sm text-gray-500">
                Add, edit, and remove users with custom permissions
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-300">
                🔐 Permission System
              </h4>
              <p className="text-sm text-gray-500">
                Control access to specific features per user
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-300">
                📊 Statistics
              </h4>
              <p className="text-sm text-gray-500">
                Track usage and activity across all users
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-300">
                📋 Activity Logs
              </h4>
              <p className="text-sm text-gray-500">
                Monitor all actions with detailed logging
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex gap-4 justify-center mb-4">
            <a
              href="/dashboard"
              className="inline-block bg-white text-black px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Open Dashboard →
            </a>
            <a
              href="/setup"
              className="inline-block bg-[#1A1A1A] border border-[#2A2A2A] text-white px-8 py-4 rounded-xl font-semibold hover:border-[#3A3A3A] transition-colors"
            >
              Setup Guide
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Or use the Telegram bot to access features on the go
          </p>
        </div>
      </div>
    </div>
  );
}
