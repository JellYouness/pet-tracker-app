import type { Database } from "./supabase";
import { supabase } from "./supabase";

type OwnershipTransferRequest =
  Database["public"]["Tables"]["ownership_transfer_requests"]["Row"];
type Animal = Database["public"]["Tables"]["animals"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

export interface OwnershipTransferWithDetails extends OwnershipTransferRequest {
  animal: Animal;
  current_owner: User;
  new_owner: User;
}

export const ownershipTransferUtils = {
  // Create a new ownership transfer request
  async createTransferRequest(
    animalId: string,
    currentOwnerId: string,
    newOwnerId: string,
    notes?: string
  ): Promise<OwnershipTransferRequest> {
    try {
      const { data, error } = await supabase
        .from("ownership_transfer_requests")
        .insert({
          animal_id: animalId,
          current_owner_id: currentOwnerId,
          new_owner_id: newOwnerId,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating transfer request:", error);
      throw error;
    }
  },

  // Helper function to fetch transfer with details
  async fetchTransferWithDetails(
    transfer: OwnershipTransferRequest
  ): Promise<OwnershipTransferWithDetails> {
    const [animalData, currentOwnerData, newOwnerData] = await Promise.all([
      supabase
        .from("animals")
        .select("*")
        .eq("id", transfer.animal_id)
        .single(),
      supabase
        .from("users")
        .select("*")
        .eq("id", transfer.current_owner_id)
        .single(),
      supabase
        .from("users")
        .select("*")
        .eq("id", transfer.new_owner_id)
        .single(),
    ]);

    return {
      ...transfer,
      animal: animalData.data!,
      current_owner: currentOwnerData.data!,
      new_owner: newOwnerData.data!,
    };
  },

  // Get pending transfer requests for a user (as new owner)
  async getPendingTransfersForUser(
    userId: string
  ): Promise<OwnershipTransferWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("ownership_transfer_requests")
        .select("*")
        .eq("new_owner_id", userId)
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch details for each transfer
      const transfersWithDetails = await Promise.all(
        (data || []).map((transfer) => this.fetchTransferWithDetails(transfer))
      );

      return transfersWithDetails;
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      throw error;
    }
  },

  // Get transfer requests created by a user (as current owner)
  async getTransferRequestsByUser(
    userId: string
  ): Promise<OwnershipTransferWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("ownership_transfer_requests")
        .select("*")
        .eq("current_owner_id", userId)
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch details for each transfer
      const transfersWithDetails = await Promise.all(
        (data || []).map((transfer) => this.fetchTransferWithDetails(transfer))
      );

      return transfersWithDetails;
    } catch (error) {
      console.error("Error fetching user's transfer requests:", error);
      throw error;
    }
  },

  // Accept an ownership transfer
  async acceptTransfer(transferId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("accept_ownership_transfer", {
        transfer_id: transferId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error accepting transfer:", error);
      throw error;
    }
  },

  // Reject an ownership transfer
  async rejectTransfer(transferId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("reject_ownership_transfer", {
        transfer_id: transferId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      throw error;
    }
  },

  // Cancel an ownership transfer (by current owner)
  async cancelTransfer(
    transferId: string,
    currentOwnerId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("cancel_ownership_transfer", {
        transfer_id: transferId,
        current_owner_id: currentOwnerId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error cancelling transfer:", error);
      throw error;
    }
  },

  // Get pending transfer for a specific animal
  async getPendingTransferForAnimal(
    animalId: string
  ): Promise<OwnershipTransferWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from("ownership_transfer_requests")
        .select("*")
        .eq("animal_id", animalId)
        .eq("status", "pending")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No pending transfer found
        }
        throw error;
      }

      if (!data) return null;

      return await this.fetchTransferWithDetails(data);
    } catch (error) {
      console.error("Error fetching pending transfer for animal:", error);
      throw error;
    }
  },

  // Check if user has pending transfers (as new owner)
  async hasPendingTransfers(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from("ownership_transfer_requests")
        .select("*", { count: "exact", head: true })
        .eq("new_owner_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error("Error checking pending transfers:", error);
      throw error;
    }
  },
};
