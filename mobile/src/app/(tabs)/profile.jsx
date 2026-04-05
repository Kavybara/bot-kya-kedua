import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Key, Plus, Trash2 } from "lucide-react-native";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [pins, setPins] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock user ID - in production, get from auth
  const userId = 123456789;

  useEffect(() => {
    loadPins();
  }, []);

  async function loadPins() {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/pins?user_id=${userId}`,
      );
      const data = await response.json();
      if (data.success) {
        setPins(data.pins);
      }
    } catch (error) {
      console.error("Error loading PINs:", error);
    }
    setLoading(false);
  }

  async function deletePin(profileName) {
    Alert.alert(
      "Delete PIN",
      `Are you sure you want to delete PIN for ${profileName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(
                `${process.env.EXPO_PUBLIC_BASE_URL}/api/pins?user_id=${userId}&profile_name=${profileName}`,
                { method: "DELETE" },
              );
              loadPins();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
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
          My Profile
        </Text>
        <Text style={{ fontSize: 14, color: "#6B6B6B" }}>
          Manage your Netflix PINs
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add PIN Button */}
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Plus color="#000000" size={20} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#000000" }}>
            Add New PIN
          </Text>
        </TouchableOpacity>

        {/* PINs List */}
        {loading ? (
          <Text
            style={{ color: "#6B6B6B", textAlign: "center", marginTop: 40 }}
          >
            Loading PINs...
          </Text>
        ) : pins.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Key color="#6B6B6B" size={48} />
            <Text
              style={{ color: "#6B6B6B", marginTop: 16, textAlign: "center" }}
            >
              No PINs saved yet{"\n"}Add your first Netflix profile PIN
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {pins.map((pin) => (
              <View
                key={pin.id}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderWidth: 1,
                  borderColor: "#2A2A2A",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#FFFFFF",
                      marginBottom: 4,
                    }}
                  >
                    {pin.profile_name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#FFFFFF",
                      fontFamily: "monospace",
                      letterSpacing: 4,
                    }}
                  >
                    {pin.pin}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deletePin(pin.profile_name)}
                  style={{
                    backgroundColor: "#EF4444",
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showAddModal && (
        <AddPinModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadPins();
          }}
        />
      )}
    </View>
  );
}

function AddPinModal({ userId, onClose, onSuccess }) {
  const [profileName, setProfileName] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profileName || !pin) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      Alert.alert("Error", "PIN must be 4 digits");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/pins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            profile_name: profileName,
            pin,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        Alert.alert("Error", data.error);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }

    setSaving(false);
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          backgroundColor: "#1A1A1A",
          borderWidth: 1,
          borderColor: "#2A2A2A",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#FFFFFF",
            marginBottom: 24,
          }}
        >
          Add New PIN
        </Text>

        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          Profile Name
        </Text>
        <TextInput
          value={profileName}
          onChangeText={setProfileName}
          placeholder="e.g., Kids, Mom, Dad"
          placeholderTextColor="#6B6B6B"
          style={{
            backgroundColor: "#0F0F0F",
            borderWidth: 1,
            borderColor: "#2A2A2A",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: "#FFFFFF",
            marginBottom: 16,
          }}
        />

        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          PIN (4 digits)
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="1234"
          placeholderTextColor="#6B6B6B"
          keyboardType="number-pad"
          maxLength={4}
          style={{
            backgroundColor: "#0F0F0F",
            borderWidth: 1,
            borderColor: "#2A2A2A",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: "#FFFFFF",
            marginBottom: 24,
            fontFamily: "monospace",
            letterSpacing: 8,
          }}
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              backgroundColor: "#2A2A2A",
              borderRadius: 8,
              padding: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 8,
              padding: 14,
              alignItems: "center",
              opacity: saving ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#000000" }}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
