import type { Database } from "../lib/supabase";
import { supabase } from "../lib/supabase";

type GpsDevice = Database["public"]["Tables"]["gps_devices"]["Row"];
type GpsLocation = Database["public"]["Tables"]["gps_locations"]["Row"];
type GpsDeviceInsert = Database["public"]["Tables"]["gps_devices"]["Insert"];
type GpsLocationInsert =
  Database["public"]["Tables"]["gps_locations"]["Insert"];

export interface GpsLocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  address?: string;
  signal_strength?: number;
  battery_level?: number;
  timestamp?: string;
}

export interface GpsDeviceData {
  device_id: string;
  name: string;
  animal_id?: string;
  device_type?: string;
  battery_level?: number;
}

export class GpsDeviceService {
  private static instance: GpsDeviceService;

  static getInstance(): GpsDeviceService {
    if (!GpsDeviceService.instance) {
      GpsDeviceService.instance = new GpsDeviceService();
    }
    return GpsDeviceService.instance;
  }

  // Add a new GPS device
  async addDevice(
    deviceData: GpsDeviceData,
    userId: string
  ): Promise<GpsDevice | null> {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .insert({
          device_id: deviceData.device_id,
          name: deviceData.name,
          animal_id: deviceData.animal_id,
          owner_id: userId,
          device_type: deviceData.device_type || "collar",
          battery_level: deviceData.battery_level,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding GPS device:", error);
      throw error;
    }
  }

  // Get all GPS devices for a user
  async getUserDevices(userId: string): Promise<GpsDevice[]> {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .select(
          `
          *,
          animals (
            id,
            name,
            race,
            gender,
            image
          )
        `
        )
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching GPS devices:", error);
      throw error;
    }
  }

  // Get a specific GPS device
  async getDevice(deviceId: string): Promise<GpsDevice | null> {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .select(
          `
          *,
          animals (
            id,
            name,
            race,
            gender,
            image
          )
        `
        )
        .eq("id", deviceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching GPS device:", error);
      throw error;
    }
  }

  // Update GPS device
  async updateDevice(
    deviceId: string,
    updates: Partial<GpsDevice>
  ): Promise<GpsDevice | null> {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .update(updates)
        .eq("id", deviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating GPS device:", error);
      throw error;
    }
  }

  // Delete GPS device
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("gps_devices")
        .delete()
        .eq("id", deviceId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting GPS device:", error);
      throw error;
    }
  }

  // Add location data from GPS device
  async addLocationData(
    deviceId: string,
    locationData: GpsLocationData
  ): Promise<GpsLocation | null> {
    try {
      // First, verify the device exists and is active
      const device = await this.getDevice(deviceId);
      if (!device || !device.is_active) {
        throw new Error("Device not found or inactive");
      }

      // Add the location data
      const { data, error } = await supabase
        .from("gps_locations")
        .insert({
          device_id: deviceId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          altitude: locationData.altitude,
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          heading: locationData.heading,
          address: locationData.address,
          signal_strength: locationData.signal_strength,
          battery_level: locationData.battery_level,
          timestamp: locationData.timestamp || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update device's last_seen and battery_level
      await this.updateDevice(deviceId, {
        last_seen: new Date().toISOString(),
        battery_level: locationData.battery_level || device.battery_level,
      });

      return data;
    } catch (error) {
      console.error("Error adding GPS location data:", error);
      throw error;
    }
  }

  // Get latest location for a device
  async getLatestLocation(deviceId: string): Promise<GpsLocation | null> {
    try {
      const { data, error } = await supabase
        .from("gps_locations")
        .select("*")
        .eq("device_id", deviceId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching latest GPS location:", error);
      throw error;
    }
  }

  // Get location history for a device
  async getLocationHistory(
    deviceId: string,
    hoursBack: number = 24
  ): Promise<GpsLocation[]> {
    try {
      const { data, error } = await supabase
        .from("gps_locations")
        .select("*")
        .eq("device_id", deviceId)
        .gte(
          "timestamp",
          new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
        )
        .order("timestamp", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching GPS location history:", error);
      throw error;
    }
  }

  // Get all devices with their latest locations
  async getDevicesWithLatestLocation(userId: string) {
    try {
      const { data, error } = await supabase.rpc("get_latest_gps_locations", {
        user_uuid: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching devices with latest location:", error);
      throw error;
    }
  }

  // Assign device to an animal
  async assignDeviceToAnimal(
    deviceId: string,
    animalId: string
  ): Promise<GpsDevice | null> {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .update({ animal_id: animalId })
        .eq("id", deviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error assigning device to animal:", error);
      throw error;
    }
  }

  // Remove device from animal
  async removeDeviceFromAnimal(deviceId: string): Promise<GpsDevice | null> {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .update({ animal_id: null })
        .eq("id", deviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error removing device from animal:", error);
      throw error;
    }
  }

  // Activate/Deactivate device
  async setDeviceActive(
    deviceId: string,
    isActive: boolean
  ): Promise<GpsDevice | null> {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .update({ is_active: isActive })
        .eq("id", deviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error setting device active status:", error);
      throw error;
    }
  }

  // Get devices that haven't reported in a while (offline devices)
  async getOfflineDevices(
    userId: string,
    hoursThreshold: number = 24
  ): Promise<GpsDevice[]> {
    try {
      const threshold = new Date(
        Date.now() - hoursThreshold * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("gps_devices")
        .select(
          `
          *,
          animals (
            id,
            name,
            race,
            gender
          )
        `
        )
        .eq("owner_id", userId)
        .eq("is_active", true)
        .or(`last_seen.is.null,last_seen.lt.${threshold}`)
        .order("last_seen", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching offline devices:", error);
      throw error;
    }
  }

  // Simulate GPS device data (for testing)
  async simulateLocationUpdate(
    deviceId: string,
    locationData: GpsLocationData
  ): Promise<GpsLocation | null> {
    // This would normally come from the actual GPS device
    // For testing, we can simulate location updates
    return await this.addLocationData(deviceId, locationData);
  }
}

export default GpsDeviceService;
