// Dashboard API utilities
import { API_ENDPOINTS } from "@/lib/config";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class DashboardAPI {
  private static getAuthHeader(): HeadersInit {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private static async fetchAPI<T>(
    url: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeader(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          window.location.href = "/login?error=session_expired";
        }
      }

      const error = await response.json();
      throw new Error(error.message || "API request failed");
    }

    const data = await response.json();
    return data;
  }

  static async getStats() {
    return this.fetchAPI(API_ENDPOINTS.DASHBOARD_STATS);
  }

  static async getQuickStats() {
    return this.fetchAPI(API_ENDPOINTS.DASHBOARD_QUICK_STATS);
  }

  static async getActiveItems(type?: "lost" | "found") {
    const url = type
      ? `${API_ENDPOINTS.DASHBOARD_ACTIVE_ITEMS}?type=${type}`
      : API_ENDPOINTS.DASHBOARD_ACTIVE_ITEMS;
    return this.fetchAPI(url);
  }

  static async getPendingClaims() {
    return this.fetchAPI(API_ENDPOINTS.DASHBOARD_PENDING_CLAIMS);
  }

  static async getTimeStats(days: number = 30) {
    return this.fetchAPI(`${API_ENDPOINTS.DASHBOARD_TIME_STATS}?days=${days}`);
  }

  static async getTopItems(limit: number = 5) {
    return this.fetchAPI(`${API_ENDPOINTS.DASHBOARD_TOP_ITEMS}?limit=${limit}`);
  }

  static async getRecentActivity(limit: number = 10) {
    return this.fetchAPI(
      `${API_ENDPOINTS.DASHBOARD_RECENT_ACTIVITY}?limit=${limit}`,
    );
  }

  static async getUserItems(options?: {
    page?: number;
    limit?: number;
    type?: "lost" | "found";
    status?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_ENDPOINTS.DASHBOARD_ITEMS}?${params.toString()}`;
    return this.fetchAPI(url);
  }

  static async createItem(formData: FormData) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const response = await fetch(API_ENDPOINTS.ITEMS, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create item");
    }

    return response.json();
  }

  static async getAllItems(options?: {
    page?: number;
    limit?: number;
    type?: "lost" | "found";
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_ENDPOINTS.ITEMS}?${params.toString()}`;
    return this.fetchAPI(url);
  }

  static async getItemById(id: string) {
    return this.fetchAPI(`${API_ENDPOINTS.ITEMS}/${id}`);
  }

  static async updateItem(id: string, data: any) {
    return this.fetchAPI(`${API_ENDPOINTS.ITEMS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async deleteItem(id: string) {
    return this.fetchAPI(`${API_ENDPOINTS.ITEMS}/${id}`, {
      method: "DELETE",
    });
  }

  static async claimItem(id: string, message: string) {
    return this.fetchAPI(`${API_ENDPOINTS.ITEMS}/${id}/claim`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  static async updateClaimStatus(
    itemId: string,
    claimId: string,
    status: "accepted" | "rejected",
  ) {
    return this.fetchAPI(`${API_ENDPOINTS.ITEMS}/${itemId}/claims/${claimId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  static async toggleBookmark(id: string) {
    return this.fetchAPI(`${API_ENDPOINTS.ITEMS}/${id}/bookmark`, {
      method: "POST",
    });
  }

  static async reportItem(id: string, reason: string) {
    return this.fetchAPI(`${API_ENDPOINTS.ITEMS}/${id}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  static async searchByLocation(options: {
    longitude: number;
    latitude: number;
    maxDistance?: number;
    type?: "lost" | "found";
    category?: string;
  }) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    const url = `${API_ENDPOINTS.ITEMS_SEARCH}?${params.toString()}`;
    return this.fetchAPI(url);
  }
}

export default DashboardAPI;
