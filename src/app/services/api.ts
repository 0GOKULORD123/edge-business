// API Service for Supabase Edge Functions
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Construct the Supabase function URL
const getSupabaseUrl = () => `https://${projectId}.supabase.co/functions/v1`;

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${getSupabaseUrl()}${endpoint}`;

  console.log(`API Call: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
    });

    console.log(`API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`API Error Response:`, error);
      throw new Error(error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`API Success:`, data);
    return data;
  } catch (error) {
    console.error(`API Call Failed:`, error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  async register(userData: any) {
    return apiCall('/make-server-037031d9/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(username: string, password: string, email?: string) {
    return apiCall('/make-server-037031d9/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
  },

  async getUser(userId: string) {
    return apiCall(`/make-server-037031d9/auth/user/${userId}`);
  },

  async updateUser(userId: string, updates: any) {
    return apiCall(`/make-server-037031d9/auth/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getAllUsers() {
    return apiCall('/make-server-037031d9/auth/users');
  },

  async adminUpdateUser(userId: string, updates: any) {
    return apiCall(`/make-server-037031d9/admin/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async adminDeleteUser(userId: string) {
    return apiCall(`/make-server-037031d9/admin/user/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Requests API
export const requestsAPI = {
  async create(requestData: any) {
    return apiCall('/make-server-037031d9/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  async getAll(userId?: string) {
    const url = userId ? `/make-server-037031d9/requests?userId=${userId}` : '/make-server-037031d9/requests';
    return apiCall(url);
  },

  async update(requestId: string, updates: any) {
    return apiCall(`/make-server-037031d9/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async addMessage(requestId: string, message: string, from: 'admin' | 'user', userId?: string) {
    return apiCall(`/make-server-037031d9/requests/${requestId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message, from, userId }),
    });
  },
};

// Notifications API
export const notificationsAPI = {
  async create(notificationData: { type: string; title: string; message: string; userId?: string; requestId?: string; broadcast?: boolean }) {
    return apiCall('/make-server-037031d9/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  async getForUser(userId: string) {
    return apiCall(`/make-server-037031d9/notifications/${userId}`);
  },

  async delete(userId: string, notificationId: string) {
    return apiCall(`/make-server-037031d9/notifications/${userId}/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// Store API
export const storeAPI = {
  async addProduct(productData: any) {
    return apiCall('/make-server-037031d9/store/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async getProducts() {
    return apiCall('/make-server-037031d9/store/products');
  },

  async deleteProduct(productId: string) {
    return apiCall(`/make-server-037031d9/store/products/${productId}`, {
      method: 'DELETE',
    });
  },

  async purchase(userId: string, productId: string) {
    return apiCall('/make-server-037031d9/store/purchase', {
      method: 'POST',
      body: JSON.stringify({ userId, productId }),
    });
  },

  async getPurchases(userId: string) {
    return apiCall(`/make-server-037031d9/store/purchases/${userId}`);
  },
};

// Marketplace API
export const marketplaceAPI = {
  async checkSeller(userId: string) {
    return apiCall(`/make-server-037031d9/marketplace/seller/${userId}`);
  },

  async activateSeller(userId: string) {
    return apiCall('/make-server-037031d9/marketplace/seller', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async addProduct(productData: any) {
    return apiCall('/make-server-037031d9/marketplace/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async getProducts(userId?: string) {
    const url = userId ? `/make-server-037031d9/marketplace/products?userId=${userId}` : '/make-server-037031d9/marketplace/products';
    return apiCall(url);
  },

  async deleteProduct(productId: string, userId: string) {
    return apiCall(`/make-server-037031d9/marketplace/products/${productId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  },

  async purchase(buyerId: string, productId: string) {
    return apiCall('/make-server-037031d9/marketplace/purchase', {
      method: 'POST',
      body: JSON.stringify({ buyerId, productId }),
    });
  },

  async getProfile(userId: string) {
    return apiCall(`/make-server-037031d9/marketplace/profile/${userId}`);
  },

  async checkSeller(userId: string) {
    return apiCall(`/make-server-037031d9/marketplace/check-seller/${userId}`);
  },
};

// Payment Settings API
export const paymentAPI = {
  async getSettings() {
    return apiCall('/make-server-037031d9/payment/settings');
  },

  async updateSettings(settings: any) {
    return apiCall('/make-server-037031d9/payment/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// Withdrawal API
export const withdrawalAPI = {
  async create(withdrawalData: any) {
    return apiCall('/make-server-037031d9/withdrawals', {
      method: 'POST',
      body: JSON.stringify(withdrawalData),
    });
  },

  async getAll(userId?: string) {
    const url = userId ? `/make-server-037031d9/withdrawals?userId=${userId}` : '/make-server-037031d9/withdrawals';
    return apiCall(url);
  },

  async update(withdrawalId: string, updates: any) {
    return apiCall(`/make-server-037031d9/withdrawals/${withdrawalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Invite Code API
export const inviteAPI = {
  async getCodes() {
    return apiCall('/make-server-037031d9/invite/codes');
  },

  async addCode(code: string) {
    return apiCall('/make-server-037031d9/invite/codes', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async deleteCode(code: string) {
    return apiCall(`/make-server-037031d9/invite/codes/${code}`, {
      method: 'DELETE',
    });
  },

  async validateCode(code: string) {
    return apiCall('/make-server-037031d9/invite/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
};

// File Upload API
export const uploadAPI = {
  async uploadFile(file: File, bucket: string = 'uploads') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);

    const url = `${getSupabaseUrl()}/make-server-037031d9/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  },
};
