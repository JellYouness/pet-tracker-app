import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { locationUtils } from "../lib/locationUtils";
import { supabase } from "../lib/supabase";

const BACKGROUND_LOCATION_TASK = "background-location-task";

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }

  try {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    if (location) {
      console.log("Background location update:", location.coords);

      // Get address from coordinates
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address =
        reverseGeocode.length > 0
          ? [
              reverseGeocode[0].street,
              reverseGeocode[0].city,
              reverseGeocode[0].region,
              reverseGeocode[0].country,
            ]
              .filter(Boolean)
              .join(", ")
          : undefined;

      // Get current user's animals and update their locations
      await updateAllPetLocations({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      });
    }
  } catch (error) {
    console.error("Error in background location task:", error);
  }
});

// Function to update all pet locations for the current user
async function updateAllPetLocations(locationData: {
  latitude: number;
  longitude: number;
  address?: string;
}) {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user found for background location update");
      return;
    }

    // Get all animals for the current user
    const { data: animals, error } = await supabase
      .from("animals")
      .select("id")
      .eq("owner_id", user.id);

    if (error) {
      console.error("Error fetching animals for background update:", error);
      return;
    }

    // Update location for each animal
    for (const animal of animals || []) {
      try {
        await locationUtils.setAnimalLocation(animal.id, locationData);
        console.log(`Updated location for animal ${animal.id}`);
      } catch (error) {
        console.error(
          `Error updating location for animal ${animal.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error in updateAllPetLocations:", error);
  }
}

export class BackgroundLocationService {
  private static instance: BackgroundLocationService;
  private isTracking = false;

  static getInstance(): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService();
    }
    return BackgroundLocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") {
        console.log("Foreground location permission denied");
        return false;
      }

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.log("Background location permission denied");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.log("Location tracking already active");
        return true;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("Location permissions not granted");
        return false;
      }

      // Start background location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5 * 60 * 1000, // 5 minutes
        distanceInterval: 100, // 100 meters
        foregroundService: {
          notificationTitle: "Pet Tracker Active",
          notificationBody: "Tracking your pets' locations",
          notificationColor: "#3498db",
        },
        // Android specific options
        android: {
          notificationTitle: "Pet Tracker Active",
          notificationBody: "Tracking your pets' locations",
          notificationColor: "#3498db",
        },
        // iOS specific options
        ios: {
          activityType: Location.ActivityType.Fitness,
          allowsBackgroundLocationUpdates: true,
          pausesLocationUpdatesAutomatically: false,
        },
      });

      this.isTracking = true;
      console.log("Background location tracking started");
      return true;
    } catch (error) {
      console.error("Error starting location tracking:", error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (!this.isTracking) {
        console.log("Location tracking not active");
        return;
      }

      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      this.isTracking = false;
      console.log("Background location tracking stopped");
    } catch (error) {
      console.error("Error stopping location tracking:", error);
    }
  }

  async isTrackingActive(): Promise<boolean> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_LOCATION_TASK
      );
      this.isTracking = isRegistered;
      return isRegistered;
    } catch (error) {
      console.error("Error checking tracking status:", error);
      return false;
    }
  }

  // Get current location immediately
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }

  // Update location for a specific pet
  async updatePetLocation(animalId: string): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        return false;
      }

      // Get address from coordinates
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address =
        reverseGeocode.length > 0
          ? [
              reverseGeocode[0].street,
              reverseGeocode[0].city,
              reverseGeocode[0].region,
              reverseGeocode[0].country,
            ]
              .filter(Boolean)
              .join(", ")
          : undefined;

      await locationUtils.setAnimalLocation(animalId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      });

      return true;
    } catch (error) {
      console.error("Error updating pet location:", error);
      return false;
    }
  }
}

export default BackgroundLocationService;
