import axios from "axios";
import { toast } from "react-hot-toast";

// Determine the base URL based on the environment
const getBaseUrl = () => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  
  if (env === 'production') {
    return import.meta.env.VITE_API_BASE_URL_PRODUCTION || 
           'https://invobilled-backend.onrender.com/api';
  }
  
  // Default to development
  return import.meta.env.VITE_API_BASE_URL_DEVELOPMENT || 
         'http://localhost:8080/api';
};

// Create and export axios instance with base config
export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Log the current API configuration for debugging
console.log('API Configuration:', {
  environment: import.meta.env.VITE_APP_ENV,
  baseURL: getBaseUrl(),
  isProduction: import.meta.env.VITE_APP_ENV === 'production'
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Skip modifying config for external APIs
    if (config.url.includes('cloudinary') || config.url.startsWith('http')) {
      return config;
    }

    try {
      // Get token using Clerk's client without specifying a template
      const token = await window.Clerk?.session?.getToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
      } else {
        console.warn('No authentication token available');
        // If we can't get a token, don't block the request
        // The server will handle unauthorized requests
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Don't fail the request if we can't get a token
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // You can add any response transformation here if needed
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error for debugging
    console.error('API Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        method: originalRequest?.method,
        headers: originalRequest?.headers,
        data: originalRequest?.data,
      },
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // If we haven't already tried to refresh the token
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Force a fresh token
          const newToken = await window.Clerk?.session?.getToken({ 
            leewayInSeconds: 60,
            skipCache: true 
          });
          
          if (newToken) {
            // Update the Authorization header
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            // Retry the original request with the new token
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          // If we can't refresh, redirect to sign-in
          if (window.Clerk?.redirectToSignIn) {
            window.Clerk.redirectToSignIn();
          }
          return Promise.reject(refreshError);
        }
      }
    }

    // Handle other error statuses
    if (error.response) {
      // Handle specific status codes
      switch (error.response.status) {
        case 403:
          error.message = 'You do not have permission to perform this action.';
          break;
        case 404:
          error.message = 'The requested resource was not found.';
          break;
        case 500:
          error.message = 'An internal server error occurred. Please try again later.';
          break;
        default:
          error.message = error.response.data?.message || error.message;
      }
    } else if (error.request) {
      // The request was made but no response was received
      error.message = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request
      error.message = error.message || 'An error occurred while processing your request.';
    }

    
    return Promise.reject(error);
  }
);

/**
 * Get all invoices for the current user
 * @param {string} baseURL - Base URL for the API
 * @returns {Promise<Array>} - Array of invoices
 */
export const getAllInvoices = async (baseURL) => {
    try {
        const response = await api.get(`/invoices`);
        return response.data;
    } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to load invoices. Please try again.');
        throw error;
    }
};

/**
 * Save an invoice
 * @param {string} baseURL - Base URL for the API
 * @param {Object} payload - Invoice data to save
 * @returns {Promise<Object>} - Saved invoice data
 */
export const saveInvoice = async (baseURL, payload) => {
    try {
        const response = await api.post(`/invoices`, payload);
        toast.success('Invoice saved successfully!');
        return response.data;
    } catch (error) {
        console.error('Error saving invoice:', error);
        toast.error('Failed to save invoice. Please try again.');
        throw error;
    }
};

/**
 * Delete an invoice
 * @param {string} baseURL - Base URL for the API
 * @param {string} id - ID of the invoice to delete
 * @returns {Promise<void>}
 */
export const deleteInvoice = async (baseURL, id) => {
    if (!id) {
        throw new Error('Invoice ID is required');
    }
    
    try {
        await api.delete(`/invoices/${id}`);
        toast.success('Invoice deleted successfully!');
    } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice. Please try again.');
        throw error;
    }
};

/**
 * Send an invoice via email
 * @param {string} baseURL - Base URL for the API
 * @param {FormData} formData - Form data containing invoice and email details
 * @returns {Promise<Object>} - Response from the server
 */
export const sendInvoice = async (baseURL, formData) => {
    if (!formData) {
        throw new Error('Form data is required');
    }
    
    try {
        const response = await api.post(`/invoices/sendinvoice`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        toast.success('Invoice sent successfully!');
        return response.data;
    } catch (error) {
        console.error('Error sending invoice:', error);
        
        let errorMessage = 'Failed to send invoice. ';
        if (error.response?.data?.message) {
            errorMessage += error.response.data.message;
        } else if (error.response?.status === 403) {
            errorMessage += 'You do not have permission to perform this action.';
        } else if (error.response?.status === 400) {
            errorMessage += 'Invalid request. Please check your input and try again.';
        } else if (!navigator.onLine) {
            errorMessage = 'You are offline. Please check your internet connection.';
        }
        
        toast.error(errorMessage);
        throw error;
    }
};
