import { supabase } from '../lib/supabase';

export interface Car {
  id: string;
  name: string;
  type: string;
  powertrain: string;
  price: string;
  features: string;
  specifications?: {
    engine: string;
    safety: string;
    fuelEconomy: string;
  };
  image: string;
  status: string;
}

export interface ServiceHub {
  id: string;
  city: string;
  country: string;
  address: string;
  type: string;
  lat?: number;
  lng?: number;
}

export interface Notification {
  id: string;
  timestamp: string;
  type: 'rental' | 'maintenance' | 'system';
  priority: 'high' | 'normal';
  title: string;
  message_body: string;
  read: boolean;
  userId?: string;
}

export const MessagingService = {
  async sendMessage(senderName: string, senderRole: 'customer' | 'mechanic', text: string, userId: string) {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName, senderRole, text, userId }),
    });
    return response.json();
  },

  async getChatHistoryHtml(userId?: string) {
    try {
      const url = userId ? `/api/chat-history?userId=${userId}` : '/api/chat-history';
      const response = await fetch(url);
      return await response.text();
    } catch (e) {
      // Ignore network errors during polling
      return '';
    }
  },

  async getFleet(): Promise<Car[]> {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch('/api/fleet');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error: any) {
        if (retries === 1 || (error.name !== 'TypeError' && error.message !== 'Failed to fetch')) {
          console.error('Failed to fetch fleet:', error.message || error);
          return [];
        }
        retries--;
        await new Promise(res => setTimeout(res, 1000)); // wait 1s before retry
      }
    }
    return [];
  },

  async getLocations(): Promise<ServiceHub[]> {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch('/api/locations');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error: any) {
        if (retries === 1 || (error.name !== 'TypeError' && error.message !== 'Failed to fetch')) {
          console.error('Failed to fetch locations:', error.message || error);
          return [];
        }
        retries--;
        await new Promise(res => setTimeout(res, 1000));
      }
    }
    return [];
  }
};
 
export const WishlistService = {
  async logActivity(userId: string, carId: string, carName: string, actionType: 'added' | 'removed') {
    try {
      const response = await fetch('/api/wishlist/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, carId, carName, actionType })
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || `Server error: ${response.status}`);
        }
        return data;
      } else {
        const text = await response.text();
        throw new Error(`Non-JSON response (${response.status}): ${text.substring(0, 100)}`);
      }
    } catch (err: any) {
      console.error('WishlistService Error:', err);
      if (err.name === 'TypeError') {
        throw new Error('Network error: Failed to fetch (Check if backend server is reachable)');
      }
      throw err;
    }
  }
};

export const NotificationService = {
  async produce(notif: Partial<Notification>) {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notif),
    });
    return response.json();
  },

  async getLatest(userId: string): Promise<Notification[]> {
    try {
      const response = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`);
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || `Server error: ${response.status}`);
        }
        return data;
      } else {
        const text = await response.text();
        console.warn("Notifications non-JSON response:", text.substring(0, 50));
        return [];
      }
    } catch (error: any) {
      if (error.name === 'TypeError') {
        // Network error during fetch, server might be restarting.
        // Return empty array to avoid console spam during polling.
        return [];
      }
      console.error("Notif fetch failure:", error);
      throw error;
    }
  },

  async getReportHtml(userId: string) {
    try {
      const response = await fetch(`/api/notifications/report?userId=${encodeURIComponent(userId)}`);
      return await response.text();
    } catch (e) {
      return '';
    }
  },

  async markRead(userId: string) {
    const response = await fetch('/api/notifications/read', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return response.json();
  },

  async handleUserLogin(user: any) {
    if (!user) return;
    
    // Check sessionStorage to prevent duplicate welcomes during the same session/reloads
    const sessionWelcomedKey = `session_welcomed_${user.id}`;
    if (sessionStorage.getItem(sessionWelcomedKey)) {
      return; 
    }

    const hasBeenWelcomed = user.user_metadata?.has_been_welcomed;
    const fullName = user.user_metadata?.full_name || 'Valued Partner';
    
    if (!hasBeenWelcomed) {
      // First timer
      await this.produce({
        type: 'system',
        priority: 'high',
        title: 'Welcome to Rent4Cars!',
        message_body: `Hello ${fullName}! Your Davao-based logistics portal is now ready for operations.`,
        userId: user.id
      });
      
      // Update metadata so we don't welcome them as a new user again
      await supabase.auth.updateUser({
        data: { has_been_welcomed: true }
      });
    } else {
      // Returning user
      await this.produce({
        type: 'system',
        priority: 'normal',
        title: 'Welcome Back',
        message_body: `Welcome back, ${fullName}. Your Davao hub status is active.`,
        userId: user.id
      });
    }

    sessionStorage.setItem(sessionWelcomedKey, 'true');
  }
};
