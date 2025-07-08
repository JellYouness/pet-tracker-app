import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, XStack } from "tamagui";
import SimpleMap from "../../components/SimpleMap";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { fetchAnimalsWithLocation } from "../../lib/supabase";

type Animal = {
  id: string;
  name: string;
  race: string;
  gender: "male" | "female";
  is_lost?: boolean;
  locations?: {
    id: string;
    latitude: number;
    longitude: number;
    address?: string;
    created_at: string;
    updated_at: string;
  } | null;
};

const { width, height } = Dimensions.get("window");

export default function MapScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: 48.8566, // Paris default
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (user) {
      fetchAnimals();
      getUserLocation();
    }
  }, [user]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const data = await fetchAnimalsWithLocation(user?.id || "");
      // Convert to the expected Animal type
      const convertedData: Animal[] = data.map((animal) => ({
        id: animal.id,
        name: animal.name,
        race: animal.race,
        gender: animal.gender,
        is_lost: animal.is_lost,
        locations: animal.locations,
      }));
      setAnimals(convertedData);

      // Update map region if we have animals with locations
      const animalsWithLocation = convertedData.filter(
        (animal) => animal.locations
      );
      if (animalsWithLocation.length > 0) {
        updateMapRegion(animalsWithLocation);
      }
    } catch (error) {
      console.error("Error fetching animals:", error);
      Alert.alert("Erreur", "Impossible de charger les animaux");
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "L'accès à la localisation est nécessaire pour afficher votre position sur la carte."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation(location);

      // Update map region to user location if no animals with locations
      if (animals.filter((animal) => animal.locations).length === 0) {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error("Error getting user location:", error);
    }
  };

  const updateMapRegion = (animalsWithLocation: Animal[]) => {
    if (animalsWithLocation.length === 0) return;

    const latitudes = animalsWithLocation.map(
      (animal) => animal.locations!.latitude
    );
    const longitudes = animalsWithLocation.map(
      (animal) => animal.locations!.longitude
    );

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5; // Add some padding
    const lngDelta = (maxLng - minLng) * 1.5;

    setRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.01),
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnimals();
    await getUserLocation();
    setRefreshing(false);
  };

  const handleMarkerPress = (animal: Animal) => {
    router.push(`/animal/${animal.id}`);
  };

  if (loading) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Text style={{ color: theme.colors.text.light }}>
          Chargement de la carte...
        </Text>
      </Stack>
    );
  }

  const animalsWithLocation = animals.filter((animal) => animal.locations);

  return (
    <Stack flex={1} backgroundColor={theme.colors.background.DEFAULT}>
      {/* Header */}
      <Stack
        padding="$4"
        backgroundColor="white"
        borderBottomWidth={1}
        borderBottomColor="#e9ecef"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Stack flex={1}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: theme.colors.text.DEFAULT,
              }}
            >
              Carte des Animaux
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.light,
                marginTop: 4,
              }}
            >
              {animalsWithLocation.length} animal
              {animalsWithLocation.length !== 1 ? "x" : ""} avec localisation
            </Text>
          </Stack>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: "#f8f9fa",
            }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text.DEFAULT}
            />
          </TouchableOpacity>
        </XStack>
      </Stack>

      {/* Map */}
      <Stack flex={1}>
        <SimpleMap
          animals={animals}
          region={region}
          onMarkerPress={handleMarkerPress}
          showsUserLocation={true}
        />
      </Stack>

      {/* Legend */}
      <Stack
        padding="$4"
        backgroundColor="white"
        borderTopWidth={1}
        borderTopColor="#e9ecef"
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.text.DEFAULT,
            marginBottom: 12,
          }}
        >
          Légende
        </Text>

        <XStack space="$4" flexWrap="wrap">
          <XStack alignItems="center" space="$2">
            <View
              style={{
                backgroundColor: "#3498db",
                borderRadius: 12,
                padding: 6,
              }}
            >
              <MaterialCommunityIcons name="paw" size={16} color="white" />
            </View>
            <Text style={{ fontSize: 14, color: theme.colors.text.DEFAULT }}>
              Mâle
            </Text>
          </XStack>

          <XStack alignItems="center" space="$2">
            <View
              style={{
                backgroundColor: "#e91e63",
                borderRadius: 12,
                padding: 6,
              }}
            >
              <MaterialCommunityIcons name="paw" size={16} color="white" />
            </View>
            <Text style={{ fontSize: 14, color: theme.colors.text.DEFAULT }}>
              Femelle
            </Text>
          </XStack>

          <XStack alignItems="center" space="$2">
            <View
              style={{
                backgroundColor: "#e74c3c",
                borderRadius: 12,
                padding: 6,
              }}
            >
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color="white"
              />
            </View>
            <Text style={{ fontSize: 14, color: theme.colors.text.DEFAULT }}>
              Perdu
            </Text>
          </XStack>
        </XStack>

        {/* Animals without location */}
        {animals.filter((animal) => !animal.locations).length > 0 && (
          <Stack
            marginTop="$3"
            padding="$3"
            backgroundColor="#f8f9fa"
            borderRadius="$3"
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: theme.colors.text.DEFAULT,
                marginBottom: 8,
              }}
            >
              Animaux sans localisation
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack space="$2">
                {animals
                  .filter((animal) => !animal.locations)
                  .map((animal) => (
                    <TouchableOpacity
                      key={animal.id}
                      onPress={() => router.push(`/animal/${animal.id}`)}
                      style={{
                        backgroundColor: "white",
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#dee2e6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.text.DEFAULT,
                        }}
                      >
                        {animal.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </XStack>
            </ScrollView>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
