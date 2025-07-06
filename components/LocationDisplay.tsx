import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { locationUtils } from "../lib/locationUtils";
import type { Database } from "../lib/supabase";

type Location = Database["public"]["Tables"]["locations"]["Row"];

interface LocationDisplayProps {
  animalId?: string;
  location?: Location | null;
  onLocationRemoved?: () => void;
}

export default function LocationDisplay({
  animalId,
  location: propLocation,
  onLocationRemoved,
}: LocationDisplayProps) {
  const [location, setLocation] = useState<Location | null>(
    propLocation || null
  );
  const [loading, setLoading] = useState(!propLocation);

  useEffect(() => {
    if (propLocation) {
      setLocation(propLocation);
      setLoading(false);
    } else if (animalId) {
      loadLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId, propLocation]);

  const loadLocation = async () => {
    if (!animalId) return;

    try {
      setLoading(true);
      const animalLocation = await locationUtils.getAnimalLocation(animalId);
      setLocation(animalLocation);
    } catch (error) {
      console.error("Error loading location:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeLocation = async () => {
    if (!animalId) {
      Alert.alert("Error", "Cannot remove location without animal ID");
      return;
    }

    Alert.alert(
      "Remove Location",
      "Are you sure you want to remove this location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await locationUtils.removeAnimalLocation(animalId);
              setLocation(null);
              onLocationRemoved?.();
            } catch (error) {
              console.error("Error removing location:", error);
              Alert.alert("Error", "Failed to remove location");
            }
          },
        },
      ]
    );
  };

  const openInMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      Linking.openURL(url);
      Alert.alert(
        "Open in Maps",
        `Would you like to open this location in Google Maps?\n\nCoordinates: ${location.latitude}, ${location.longitude}`
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.noLocationText}>
          No location saved for this pet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Location</Text>
        {animalId && (
          <TouchableOpacity
            onPress={removeLocation}
            style={styles.removeButton}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.locationInfo}>
        <View style={styles.coordinateRow}>
          <MaterialCommunityIcons name="latitude" size={16} color="#666" />
          <Text style={styles.coordinateText}>
            {location.latitude.toFixed(6)}
          </Text>
        </View>

        <View style={styles.coordinateRow}>
          <MaterialCommunityIcons name="longitude" size={16} color="#666" />
          <Text style={styles.coordinateText}>
            {location.longitude.toFixed(6)}
          </Text>
        </View>

        {location.address && (
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
            <Text style={styles.addressText}>{location.address}</Text>
          </View>
        )}

        <Text style={styles.timestamp}>
          Saved: {new Date(location.created_at).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity onPress={openInMaps} style={styles.mapsButton}>
        <MaterialCommunityIcons name="map" size={20} color="white" />
        <Text style={styles.mapsButtonText}>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  removeButton: {
    padding: 4,
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  noLocationText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  locationInfo: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  coordinateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  coordinateText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    fontFamily: "monospace",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 6,
  },
  mapsButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
});
