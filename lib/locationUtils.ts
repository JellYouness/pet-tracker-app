import type { Database } from "./supabase";
import { supabase } from "./supabase";

type Location = Database["public"]["Tables"]["locations"]["Row"];
type LocationInsert = Database["public"]["Tables"]["locations"]["Insert"];

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export const locationUtils = {
  // Add or update location for an animal (one-to-one relationship)
  async setAnimalLocation(
    animalId: string,
    locationData: LocationData
  ): Promise<Location | null> {
    try {
      // First, check if the animal already has a location
      const { data: animal } = await supabase
        .from("animals")
        .select("location_id")
        .eq("id", animalId)
        .single();

      if (animal?.location_id) {
        // Update existing location
        const { data, error } = await supabase
          .from("locations")
          .update({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
          })
          .eq("id", animal.location_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new location and link it to the animal
        const { data: newLocation, error: locationError } = await supabase
          .from("locations")
          .insert({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
          })
          .select()
          .single();

        if (locationError) throw locationError;

        // Update animal with the new location_id
        const { error: animalError } = await supabase
          .from("animals")
          .update({ location_id: newLocation.id })
          .eq("id", animalId);

        if (animalError) throw animalError;

        return newLocation;
      }
    } catch (error) {
      console.error("Error setting animal location:", error);
      throw error;
    }
  },

  // Get location for an animal
  async getAnimalLocation(animalId: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from("animals")
        .select(
          `
          location_id,
          locations (
            id,
            latitude,
            longitude,
            address,
            created_at,
            updated_at
          )
        `
        )
        .eq("id", animalId)
        .single();

      if (error) throw error;
      return data.locations as Location | null;
    } catch (error) {
      console.error("Error getting animal location:", error);
      throw error;
    }
  },

  // Get all animals with their locations for a user
  async getAnimalsWithLocation(userId: string) {
    try {
      const { data, error } = await supabase.rpc("get_animals_with_location", {
        user_uuid: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting animals with location:", error);
      throw error;
    }
  },

  // Remove location from an animal
  async removeAnimalLocation(animalId: string): Promise<void> {
    try {
      // Get the current location_id
      const { data: animal } = await supabase
        .from("animals")
        .select("location_id")
        .eq("id", animalId)
        .single();

      if (animal?.location_id) {
        // Remove the location_id from the animal
        const { error: animalError } = await supabase
          .from("animals")
          .update({ location_id: null })
          .eq("id", animalId);

        if (animalError) throw animalError;

        // Delete the location record
        const { error: locationError } = await supabase
          .from("locations")
          .delete()
          .eq("id", animal.location_id);

        if (locationError) throw locationError;
      }
    } catch (error) {
      console.error("Error removing animal location:", error);
      throw error;
    }
  },

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Convert degrees to radians
  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  // Format distance for display
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  },
};
