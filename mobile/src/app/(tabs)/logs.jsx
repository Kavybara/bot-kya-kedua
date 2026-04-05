import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/logs?limit=50`,
      );
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }

  function onRefresh() {
    setRefreshing(true);
    loadLogs();
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          padding: 24,
          borderBottomWidth: 1,
          borderBottomColor: "#2A2A2A",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#FFFFFF",
            marginBottom: 4,
          }}
        >
          Activity Logs
        </Text>
        <Text style={{ fontSize: 14, color: "#6B6B6B" }}>
          {logs.length} recent activities
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {loading ? (
          <Text
            style={{ color: "#6B6B6B", textAlign: "center", marginTop: 40 }}
          >
            Loading logs...
          </Text>
        ) : logs.length === 0 ? (
          <Text
            style={{ color: "#6B6B6B", textAlign: "center", marginTop: 40 }}
          >
            No activity logs yet
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {logs.map((log) => (
              <View
                key={log.id}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderWidth: 1,
                  borderColor: "#2A2A2A",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    {log.user_name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: log.success ? "#10B981" : "#EF4444",
                    }}
                  >
                    {log.success ? "✓ Success" : "✗ Failed"}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "#3B82F6",
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#FFFFFF",
                      fontWeight: "500",
                    }}
                  >
                    {log.action}
                  </Text>
                </View>

                <Text
                  style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 4 }}
                >
                  {log.target_email}
                </Text>

                <Text style={{ fontSize: 12, color: "#6B6B6B" }}>
                  {new Date(log.created_at).toLocaleString("id-ID")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
