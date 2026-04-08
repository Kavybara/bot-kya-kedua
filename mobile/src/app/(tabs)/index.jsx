import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Key, Link, Home as HomeIcon } from "lucide-react-native";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSearch(action) {
    if (!email) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/gmail/parse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_email: email,
            max_age_seconds: 900,
            required_field: action,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        Alert.alert("Not Found", data.error);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }

    setLoading(false);
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
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
              fontSize: 32,
              fontWeight: "bold",
              color: "#FFFFFF",
              marginBottom: 8,
            }}
          >
            🎬 Netflix Bot
          </Text>
          <Text style={{ fontSize: 16, color: "#6B6B6B" }}>
            Extract data from Netflix emails
          </Text>
        </View>

        {/* Email Input */}
        <View style={{ padding: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#FFFFFF",
              marginBottom: 12,
            }}
          >
            Netflix Email Address
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="example@gmail.com"
            placeholderTextColor="#6B6B6B"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              backgroundColor: "#1A1A1A",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#FFFFFF",
              marginBottom: 24,
            }}
          />

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => handleSearch("sign_in_code")}
              disabled={loading}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Key color="#000000" size={24} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#000000" }}
                >
                  Get Sign-In Code
                </Text>
                <Text style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                  Extract verification code
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSearch("reset_link")}
              disabled={loading}
              style={{
                backgroundColor: "#1A1A1A",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Link color="#FFFFFF" size={24} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
                >
                  Get Reset Link
                </Text>
                <Text style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                  Password reset URL
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSearch("household_link")}
              disabled={loading}
              style={{
                backgroundColor: "#1A1A1A",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <HomeIcon color="#FFFFFF" size={24} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
                >
                  Get Household Link
                </Text>
                <Text style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                  Household management URL
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: "#6B6B6B" }}>Searching email...</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={{ padding: 24 }}>
            <View
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
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#FFFFFF",
                  marginBottom: 16,
                }}
              >
                ✅ Email Found
              </Text>

              {result.sign_in_code && (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4 }}
                  >
                    Sign-In Code
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#FFFFFF",
                      fontFamily: "monospace",
                    }}
                  >
                    {result.sign_in_code}
                  </Text>
                </View>
              )}

              {result.reset_link && (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4 }}
                  >
                    Reset Link
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#3B82F6" }}
                    numberOfLines={2}
                  >
                    {result.reset_link}
                  </Text>
                </View>
              )}

              {result.household_link && (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 4 }}
                  >
                    Household Link
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#3B82F6" }}
                    numberOfLines={2}
                  >
                    {result.household_link}
                  </Text>
                </View>
              )}

              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#2A2A2A",
                }}
              >
                <Text style={{ fontSize: 12, color: "#6B6B6B" }}>
                  {result.subject}
                </Text>
                <Text style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                  {result.date}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
