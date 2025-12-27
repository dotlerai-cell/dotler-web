/**
 * WhatsApp Admin API Service
 * Handles all API communication with the WhatsApp admin backend
 */

import { AppConfigService } from '../config/config';
import {
  User,
  Campaign,
  Complaint,
  ComplaintAnalyticsData,
  IntentStatsData,
  AdminLoginResponse,
  BroadcastResponse,
  ApiException,
} from '../types';

class ApiService {
  private adminToken: string | null = null;

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': AppConfigService.getApiKey(),
    };

    if (this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
    }

    return headers;
  }

  private getBaseUrl(): string {
    return AppConfigService.getBaseUrl();
  }

  /**
   * Admin Login
   * @param username Admin username
   * @param password Admin password
   * @returns Token for authenticated requests
   */
  async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    try {
      const url = `${this.getBaseUrl()}/admin/login`;
      const body = JSON.stringify({ username, password });


      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body,
      });


      const result = await response.json();

      if (response.status === 200) {
        if (result.token) {
          this.adminToken = result.token;
          localStorage.setItem('wa_admin_token', result.token as string);
        }
        return result;
      } else {
        throw new ApiException(result.detail || result.error || 'Login failed');
      }
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize with stored token
   */
  initializeWithToken(): void {
    const token = localStorage.getItem('wa_admin_token');
    if (token) {
      this.adminToken = token;
    }
  }

  /**
   * Logout - clear token
   */
  logout(): void {
    this.adminToken = null;
    localStorage.removeItem('wa_admin_token');
  }

  /**
   * Upload users via CSV file. Expects a multipart/form-data POST endpoint
   * on the backend that accepts a `file` field.
   */
  async uploadUsersCsv(file: File): Promise<{ success: boolean; imported: number }> {
    try {
      const url = `${this.getBaseUrl()}/admin/users/upload`;
      const form = new FormData();
      form.append('file', file);

      const headers: Record<string, string> = {
        'X-API-Key': AppConfigService.getApiKey(),
      };

      if (this.adminToken) {
        headers['Authorization'] = `Bearer ${this.adminToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: form,
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new ApiException(result.detail || 'CSV upload failed');
      }

      return result;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all users
   * @returns List of all registered users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const url = `${this.getBaseUrl()}/admin/users`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new ApiException(result.detail || 'Failed to fetch users');
      }

      return result.users || [];
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a new user
   * @param phone User's WhatsApp number
   * @param name User's name
   * @returns Created user data
   */
  async addUser(phone: string, name: string): Promise<User> {
    try {
      const url = `${this.getBaseUrl()}/admin/add-user`;
      const body = JSON.stringify({ phone, name });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body,
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new ApiException(result.detail || 'Failed to add user');
      }

      return result;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send broadcast to selected users
   * @param message Message to broadcast
   * @param selectedPhones Array of phone numbers to send to
   * @param imageUrl Optional image URL
   * @returns Broadcast response with sent count
   */
  async sendBroadcastSelected(
    message: string,
    selectedPhones: string[],
    imageUrl?: string
  ): Promise<BroadcastResponse> {
    try {
      const url = `${this.getBaseUrl()}/admin/broadcast-selected`;
      const body = JSON.stringify({
        message,
        selectedPhones,
        imageUrl: imageUrl || undefined,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body,
      });

      const result = await response.json();

      if (response.status !== 200) {
        const detailMsg = result.detail ? String(result.detail) : JSON.stringify(result);
        throw new ApiException(detailMsg || 'Broadcast failed');
      }

      return result;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get broadcast history/campaigns
   * @param limit Maximum number of campaigns to fetch
   * @returns List of past broadcasts/campaigns
   */
  async getBroadcastHistory(limit: number = 100): Promise<Campaign[]> {
    try {
      const url = `${this.getBaseUrl()}/admin/broadcast-history?limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new ApiException(result.detail || 'Failed to fetch broadcast history');
      }

      return result.items || [];
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get complaint analytics
   * @returns Analytics data including total, weekly, trends, and top problems
   */
  async getComplaintAnalytics(): Promise<ComplaintAnalyticsData> {
    try {
      const url = `${this.getBaseUrl()}/admin/complaints/analytics`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new ApiException(result.detail || 'Failed to load analytics');
      }

      return result;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get recent complaints
   * @param limit Maximum number of complaints to fetch
   * @returns List of recent complaints with details
   */
  async getRecentComplaints(limit: number = 20): Promise<{ complaints: Complaint[] }> {
    try {
      const url = `${this.getBaseUrl()}/admin/complaints/recent?limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new ApiException(result.detail || 'Failed to load complaints');
      }

      return result;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get intent statistics
   * @returns Intent distribution and ML accuracy metrics
   */
  async getIntentStats(): Promise<IntentStatsData> {
    try {
      const url = `${this.getBaseUrl()}/admin/intent/stats`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new ApiException(result.detail || 'Failed to load intent stats');
      }

      return result;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default new ApiService();
