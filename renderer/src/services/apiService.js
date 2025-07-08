class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Stamp operations
  async getStamps(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.user_uuid) queryParams.append('user_uuid', filters.user_uuid);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/stamps${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getStamp(stampUuid) {
    return this.request(`/api/stamps/${stampUuid}`);
  }

  async createStamp(stampData) {
    return this.request('/api/stamps', {
      method: 'POST',
      body: JSON.stringify(stampData),
    });
  }

  async updateStamp(stampUuid, updateData) {
    return this.request(`/api/stamps/${stampUuid}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteStamp(stampUuid) {
    return this.request(`/api/stamps/${stampUuid}`, {
      method: 'DELETE',
    });
  }

  // File upload
  async uploadImages(files, userUuid = 'default-user') {
    const formData = new FormData();
    
    // Add user UUID
    formData.append('user_uuid', userUuid);
    
    // Add files
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    return this.request('/api/upload/images', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Settings operations
  async getSettings() {
    return this.request('/api/settings');
  }

  async saveSettings(settings) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Scott catalog operations
  async searchScottCatalog(query) {
    const queryParams = new URLSearchParams();
    
    if (query.country) queryParams.append('country', query.country);
    if (query.number) queryParams.append('number', query.number);
    if (query.description) queryParams.append('description', query.description);

    const queryString = queryParams.toString();
    const endpoint = `/api/scott/search${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // Market research operations
  async getMarketResearch(stampUuid) {
    return this.request(`/api/market/research/${stampUuid}`);
  }

  // Utility methods
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  getImageUrl(filePath) {
    if (!filePath) return null;
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // Construct URL relative to uploads directory
    return `${this.baseURL}/uploads/${filePath.replace(/^.*[\\\/]/, '')}`;
  }

  async validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    return true;
  }

  async resizeImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export const apiService = new ApiService();
export default apiService;
