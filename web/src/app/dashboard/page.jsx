"use client";

import { useState, useEffect } from "react";
import { Users, Activity, BarChart3, Key } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) setUsers(data.users);
      } else if (activeTab === "logs") {
        const res = await fetch("/api/logs?limit=50");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) setLogs(data.logs);
      } else if (activeTab === "stats") {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-[#2A2A2A] bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">Netflix Bot Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage users, view logs, and track statistics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2A2A2A] bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Users size={20} />
              <span className="font-medium">Users</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                activeTab === "logs"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <Activity size={20} />
              <span className="font-medium">Activity Logs</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <BarChart3 size={20} />
              <span className="font-medium">Statistics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === "users" && (
              <UsersTab users={users} onRefresh={loadData} />
            )}
            {activeTab === "logs" && <LogsTab logs={logs} />}
            {activeTab === "stats" && <StatsTab stats={stats} />}
          </>
        )}
      </div>
    </div>
  );
}

function UsersTab({ users, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Users ({users.length})</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          + Add User
        </button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-[#1A1A1A] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  {user.is_admin && (
                    <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  ID:{" "}
                  <code className="bg-[#0A0A0A] px-2 py-1 rounded">
                    {user.id}
                  </code>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {user.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">
                      No permissions
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-[#2A2A2A] transition-colors">
                  Edit
                </button>
                <button className="text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-500/10 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

function LogsTab({ logs }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Activity Logs ({logs.length})</h2>
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F0F0F] border-b border-[#2A2A2A]">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Time
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  User
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Action
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Target Email
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-[#2A2A2A] hover:bg-[#1F1F1F] transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{log.user_name}</div>
                    <div className="text-xs text-gray-500">
                      ID: {log.user_id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {log.target_email}
                  </td>
                  <td className="px-6 py-4">
                    {log.success ? (
                      <span className="text-green-400">✓ Success</span>
                    ) : (
                      <span className="text-red-400">✗ Failed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatsTab({ stats }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Usage Statistics</h2>
      <div className="grid gap-4">
        {stats.map((stat) => (
          <div
            key={stat.user_id}
            className="bg-[#1A1A1A] p-6 rounded-xl border border-[#2A2A2A]"
          >
            <h3 className="text-xl font-semibold mb-4">{stat.user_name}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {stat.actions.map((action) => (
                <div
                  key={action.action}
                  className="bg-[#0F0F0F] p-4 rounded-lg"
                >
                  <div className="text-sm text-gray-400 mb-1">
                    {action.action}
                  </div>
                  <div className="text-2xl font-bold">{action.count}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last:{" "}
                    {new Date(action.last_used).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    permissions: [],
  });
  const [saving, setSaving] = useState(false);

  const availablePermissions = ["sign_in_code", "reset_password", "household"];

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
    }

    setSaving(false);
  }

  function togglePermission(perm) {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6">Add New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Telegram ID
            </label>
            <input
              type="text"
              required
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
              placeholder="123456789"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Permissions
            </label>
            <div className="space-y-2">
              {availablePermissions.map((perm) => (
                <label
                  key={perm}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    className="w-5 h-5 rounded border-[#2A2A2A] bg-[#0F0F0F]"
                  />
                  <span className="text-sm">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#2A2A2A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
