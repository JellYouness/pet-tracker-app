import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import GpsLocationDisplay from "../../../components/GpsLocationDisplay";
import type { Database } from "../../../lib/supabase";
import GpsDeviceService from "../../../services/GpsDeviceService";

type GpsDevice = Database["public"]["Tables"]["gps_devices"]["Row"];

export default function GpsDeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [device, setDevice] = useState<GpsDevice | null>(null);
  const [loading, setLoading] = useState(true);

  const gpsService = GpsDeviceService.getInstance();

  useEffect(() => {
    if (id) {
      loadDevice();
    }
  }, [id]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const deviceData = await gpsService.getDevice(id as string);
      setDevice(deviceData);
    } catch (error) {
      console.error("Error loading GPS device:", error);
      Alert.alert("Error", "Failed to load GPS device");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading device...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="satellite-variant-off"
            size={64}
            color="#ccc"
          />
          <Text style={styles.errorText}>Device not found</Text>
          <Text style={styles.errorSubtext}>
            The GPS device you're looking for doesn't exist
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Device Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name="satellite-variant"
            size={32}
            color="#3498db"
          />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceId}>ID: {device.device_id}</Text>
            <Text style={styles.deviceType}>{device.device_type}</Text>
          </View>
        </View>

        <View style={styles.deviceStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: device.is_active ? "#27ae60" : "#999" },
            ]}
          />
          <Text style={styles.statusText}>
            {device.is_active ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {/* Device Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Device Information</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Device Type:</Text>
          <Text style={styles.detailValue}>{device.device_type}</Text>
        </View>

        {device.battery_level !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Battery Level:</Text>
            <Text style={styles.detailValue}>{device.battery_level}%</Text>
          </View>
        )}

        {device.last_seen && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Seen:</Text>
            <Text style={styles.detailValue}>
              {new Date(device.last_seen).toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>
            {new Date(device.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Location Display */}
      <View style={styles.locationSection}>
        <GpsLocationDisplay
          deviceId={device.id}
          device={device}
          showHistory={true}
          onLocationSelect={(location) => {
            console.log("Selected location:", location);
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deviceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  deviceId: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  deviceType: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    textTransform: "capitalize",
  },
  deviceStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
  },
  locationSection: {
    marginHorizontal: 16,
  },
});
