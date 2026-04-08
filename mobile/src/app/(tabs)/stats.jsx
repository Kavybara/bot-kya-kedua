import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/stats`,
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }

  function onRefresh() {
    setRefreshing(true);
    loadStats();
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
          Statistics
        </Text>
        <Text style={{ fontSize: 14, color: "#6B6B6B" }}>Usage overview</Text>
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
            Loading statistics...
          </Text>
        ) : stats.length === 0 ? (
          <Text
            style={{ color: "#6B6B6B", textAlign: "center", marginTop: 40 }}
          >
            No statistics available yet
          </Text>
        ) : (
          <View style={{ gap: 16 }}>
            {stats.map((stat) => (
              <View
                key={stat.user_id}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderWidth: 1,
                  borderColor: "#2A2A2A",
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#FFFFFF",
                    marginBottom: 16,
                  }}
                >
                  {stat.user_name}
                </Text>

                <View style={{ gap: 12 }}>
                  {stat.actions.map((action) => (
                    <View
                      key={action.action}
                      style={{
                        backgroundColor: "#0F0F0F",
                        borderRadius: 8,
                        padding: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6B6B6B",
                          marginBottom: 4,
                        }}
                      >
                        {action.action}
                      </Text>
                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: "bold",
                          color: "#FFFFFF",
                          marginBottom: 4,
                        }}
                      >
                        {action.count}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#6B6B6B" }}>
                        Last used:{" "}
                        {new Date(action.last_used).toLocaleDateString("id-ID")}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
