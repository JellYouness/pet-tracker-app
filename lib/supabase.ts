import { createClient } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import Constants from "expo-constants";
import "react-native-url-polyfill/auto";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? "";
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          cin: string;
          address: string;
          mobile: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string;
          cin?: string;
          address?: string;
          mobile?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          cin?: string;
          address?: string;
          mobile?: string;
          created_at?: string;
        };
      };
      animals: {
        Row: {
          birthplace: any;
          image: any;
          id: string;
          nfc_id: string;
          name: string;
          birthdate: string;
          race: string;
          gender: "male" | "female";
          owner_id: string;
          location_id?: string;
          created_at: string;
          is_lost?: boolean;
          lost_since?: string;
          lost_notes?: string;
          vaccinations: { name: string; date: string; notes?: string }[];
          allergies?: string;
          chronic_conditions?: string;
          medications?: string;
          sterilized?: boolean;
          last_checkup?: string;
          medical_notes?: string;
          locations?: {
            id: string;
            latitude: number;
            longitude: number;
            address?: string;
            created_at: string;
            updated_at: string;
          } | null;
          gps_devices?:
            | {
                id: string;
                device_id: string;
                name: string;
                device_type: string;
                battery_level?: number;
                is_active: boolean;
                last_seen?: string;
                created_at: string;
                updated_at: string;
              }[]
            | null;
        };
        Insert: {
          id?: string;
          nfc_id: string;
          name: string;
          birthdate: string;
          race: string;
          gender: "male" | "female";
          owner_id: string;
          location_id?: string;
          created_at?: string;
          is_lost?: boolean;
          lost_since?: string;
          lost_notes?: string;
          vaccinations?: { name: string; date: string; notes?: string }[];
          allergies?: string;
          chronic_conditions?: string;
          medications?: string;
          sterilized?: boolean;
          last_checkup?: string;
          medical_notes?: string;
        };
        Update: {
          id?: string;
          nfc_id?: string;
          name?: string;
          birthdate?: string;
          race?: string;
          gender?: "male" | "female";
          owner_id?: string;
          location_id?: string;
          created_at?: string;
          is_lost?: boolean;
          lost_since?: string;
          lost_notes?: string;
          vaccinations?: { name: string; date: string; notes?: string }[];
          allergies?: string;
          chronic_conditions?: string;
          medications?: string;
          sterilized?: boolean;
          last_checkup?: string;
          medical_notes?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          latitude: number;
          longitude: number;
          address?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          latitude: number;
          longitude: number;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          latitude?: number;
          longitude?: number;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ownership_transfer_requests: {
        Row: {
          id: string;
          animal_id: string;
          current_owner_id: string;
          new_owner_id: string;
          status: "pending" | "accepted" | "rejected" | "cancelled";
          requested_at: string;
          responded_at?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          current_owner_id: string;
          new_owner_id: string;
          status?: "pending" | "accepted" | "rejected" | "cancelled";
          requested_at?: string;
          responded_at?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          current_owner_id?: string;
          new_owner_id?: string;
          status?: "pending" | "accepted" | "rejected" | "cancelled";
          requested_at?: string;
          responded_at?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      animal_photos: {
        Row: {
          id: string;
          animal_id: string;
          photo_url: string;
          photo_name?: string;
          description?: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          photo_url: string;
          photo_name?: string;
          description?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          photo_url?: string;
          photo_name?: string;
          description?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_animals_with_location: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          animal_id: string;
          animal_name: string;
          animal_race: string;
          animal_gender: string;
          animal_image: string;
          latitude?: number;
          longitude?: number;
          address?: string;
          location_created_at?: string;
        }[];
      };
      get_latest_gps_locations: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          device_id: string;
          device_name: string;
          animal_id?: string;
          animal_name?: string;
          animal_race?: string;
          animal_gender?: string;
          latitude?: number;
          longitude?: number;
          altitude?: number;
          accuracy?: number;
          speed?: number;
          heading?: number;
          address?: string;
          signal_strength?: number;
          battery_level?: number;
          last_seen?: string;
          location_timestamp?: string;
        }[];
      };
      get_device_location_history: {
        Args: {
          device_uuid: string;
          hours_back?: number;
        };
        Returns: {
          latitude: number;
          longitude: number;
          altitude?: number;
          accuracy?: number;
          speed?: number;
          heading?: number;
          address?: string;
          signal_strength?: number;
          battery_level?: number;
          timestamp: string;
        }[];
      };
      accept_ownership_transfer: {
        Args: {
          transfer_id: string;
        };
        Returns: boolean;
      };
      reject_ownership_transfer: {
        Args: {
          transfer_id: string;
        };
        Returns: boolean;
      };
      cancel_ownership_transfer: {
        Args: {
          transfer_id: string;
          current_owner_id: string;
        };
        Returns: boolean;
      };
    };
  };
};

// Utility function to fetch animals with location data
export const fetchAnimalsWithLocation = async (userId: string) => {
  const { data, error } = await supabase
    .from("animals")
    .select(
      `
      *,
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
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Utility function to fetch a single animal with location data
export const fetchAnimalWithLocation = async (animalId: string) => {
  const { data, error } = await supabase
    .from("animals")
    .select(
      `
      *,
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
  return data;
};

// Utility function to fetch GPS devices with latest location
export const fetchGpsDevicesWithLocation = async (userId: string) => {
  const { data, error } = await supabase.rpc("get_latest_gps_locations", {
    user_uuid: userId,
  });

  if (error) throw error;
  return data || [];
};

// Utility function to fetch GPS device location history
export const fetchGpsDeviceHistory = async (
  deviceId: string,
  hoursBack: number = 24
) => {
  const { data, error } = await supabase.rpc("get_device_location_history", {
    device_uuid: deviceId,
    hours_back: hoursBack,
  });

  if (error) throw error;
  return data || [];
};

// Lost animal utility functions
export const markAnimalAsLost = async (
  animalId: string,
  lostNotes?: string
) => {
  const { data, error } = await supabase
    .from("animals")
    .update({
      is_lost: true,
      lost_since: new Date().toISOString(),
      lost_notes: lostNotes,
    })
    .eq("id", animalId)
    .select()
    .single();

  if (error) {
    console.error("Error marking animal as lost:", error);
    throw error;
  }

  return data;
};

export const markAnimalAsFound = async (animalId: string) => {
  const { data, error } = await supabase
    .from("animals")
    .update({
      is_lost: false,
      lost_since: null,
      lost_notes: null,
    })
    .eq("id", animalId)
    .select()
    .single();

  if (error) {
    console.error("Error marking animal as found:", error);
    throw error;
  }

  return data;
};

export const fetchLostAnimals = async () => {
  // First, get all lost animals
  const { data: animals, error: animalsError } = await supabase
    .from("animals")
    .select("id, name, race, gender, image, lost_since, lost_notes, owner_id")
    .eq("is_lost", true)
    .order("lost_since", { ascending: false });

  if (animalsError) {
    console.error("Error fetching lost animals:", animalsError);
    throw animalsError;
  }

  if (!animals || animals.length === 0) {
    return [];
  }

  // Get owner IDs
  const ownerIds = animals.map((animal) => animal.owner_id);

  // Fetch owner information
  const { data: owners, error: ownersError } = await supabase
    .from("users")
    .select("id, name, email, mobile")
    .in("id", ownerIds);

  if (ownersError) {
    console.error("Error fetching owners:", ownersError);
    throw ownersError;
  }

  // Create a map of owner data
  const ownerMap = new Map();
  owners?.forEach((owner) => {
    ownerMap.set(owner.id, owner);
  });

  // Transform the data to match the expected format
  return animals.map((animal) => {
    const owner = ownerMap.get(animal.owner_id);
    return {
      animal_id: animal.id,
      animal_name: animal.name,
      animal_race: animal.race,
      animal_gender: animal.gender,
      animal_image: animal.image,
      owner_name: owner?.name || "Unknown",
      owner_email: owner?.email || "",
      owner_phone: owner?.mobile || "",
      lost_since: animal.lost_since,
      lost_notes: animal.lost_notes || "",
    };
  });
};

export const fetchLostAnimalsByOwner = async (ownerId: string) => {
  const { data, error } = await supabase
    .from("animals")
    .select("id, name, race, gender, image, lost_since, lost_notes")
    .eq("owner_id", ownerId)
    .eq("is_lost", true)
    .order("lost_since", { ascending: false });

  if (error) {
    console.error("Error fetching lost animals by owner:", error);
    throw error;
  }

  // Transform the data to match the expected format
  return (
    data?.map((animal) => ({
      animal_id: animal.id,
      animal_name: animal.name,
      animal_race: animal.race,
      animal_gender: animal.gender,
      animal_image: animal.image,
      lost_since: animal.lost_since,
      lost_notes: animal.lost_notes || "",
    })) || []
  );
};

// Animal Photos utility functions
export const fetchAnimalPhotos = async (animalId: string) => {
  const { data, error } = await supabase
    .from("animal_photos")
    .select("*")
    .eq("animal_id", animalId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching animal photos:", error);
    throw error;
  }

  return data || [];
};

export const uploadAnimalPhoto = async (
  animalId: string,
  photoUri: string,
  photoName?: string,
  description?: string,
  isPrimary: boolean = false,
  base64?: string
) => {
  try {
    // If base64 is provided, use it (like register/edit screens)
    if (base64) {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = photoUri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${animalId}_${timestamp}.${fileExtension}`;
      const filePath = `gallery/${fileName}`;

      console.log("Uploading photo with base64 to:", filePath);

      // Upload to Supabase storage using base64
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("animal-images")
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExtension}`,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("animal-images").getPublicUrl(filePath);

      console.log("Public URL:", publicUrl);

      // Save photo record to database
      const { data, error } = await supabase
        .from("animal_photos")
        .insert({
          animal_id: animalId,
          photo_url: publicUrl,
          photo_name: photoName,
          description,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) {
        console.error("Database insert error:", error);
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from("animal-images").remove([filePath]);
        throw error;
      }

      console.log("Photo record saved:", data);
      return data;
    } else {
      // Fallback to blob approach for direct URIs
      // For React Native, we need to use the file system approach
      // Convert the URI to a blob using fetch (this works in React Native)
      const response = await fetch(photoUri);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = photoUri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${animalId}_${timestamp}.${fileExtension}`;
      const filePath = `gallery/${fileName}`;

      console.log("Uploading photo to:", filePath);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("animal-images")
        .upload(filePath, blob, {
          contentType: `image/${fileExtension}`,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("animal-images").getPublicUrl(filePath);

      console.log("Public URL:", publicUrl);

      // Save photo record to database
      const { data, error } = await supabase
        .from("animal_photos")
        .insert({
          animal_id: animalId,
          photo_url: publicUrl,
          photo_name: photoName,
          description,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) {
        console.error("Database insert error:", error);
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from("animal-images").remove([filePath]);
        throw error;
      }

      console.log("Photo record saved:", data);
      return data;
    }
  } catch (error) {
    console.error("Error uploading animal photo:", error);
    throw error;
  }
};

export const deleteAnimalPhoto = async (photoId: string) => {
  try {
    // First, get the photo data to extract the file path
    const { data: photo, error: fetchError } = await supabase
      .from("animal_photos")
      .select("photo_url")
      .eq("id", photoId)
      .single();

    if (fetchError) {
      console.error("Error fetching photo for deletion:", fetchError);
      throw fetchError;
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("animal_photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      console.error("Error deleting animal photo from database:", deleteError);
      throw deleteError;
    }

    // Extract file path from the URL and delete from storage
    if (photo?.photo_url) {
      try {
        // Extract the path from the public URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/animal-images/[path]
        const url = new URL(photo.photo_url);
        const pathParts = url.pathname.split("/");
        const bucketIndex = pathParts.findIndex(
          (part) => part === "animal-images"
        );

        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join("/");

          const { error: storageError } = await supabase.storage
            .from("animal-images")
            .remove([filePath]);

          if (storageError) {
            console.error("Error deleting file from storage:", storageError);
            // Don't throw here - the database record is already deleted
          }
        }
      } catch (urlError) {
        console.error(
          "Error parsing photo URL for storage deletion:",
          urlError
        );
        // Don't throw here - the database record is already deleted
      }
    }
  } catch (error) {
    console.error("Error deleting animal photo:", error);
    throw error;
  }
};

export const setPrimaryPhoto = async (photoId: string, animalId: string) => {
  // First, unset all primary photos for this animal
  await supabase
    .from("animal_photos")
    .update({ is_primary: false })
    .eq("animal_id", animalId);

  // Then set the selected photo as primary
  const { data, error } = await supabase
    .from("animal_photos")
    .update({ is_primary: true })
    .eq("id", photoId)
    .select()
    .single();

  if (error) {
    console.error("Error setting primary photo:", error);
    throw error;
  }

  return data;
};
