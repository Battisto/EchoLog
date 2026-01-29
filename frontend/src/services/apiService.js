import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle data extraction
apiService.interceptors.response.use(
  (response) => {
    return response.data; // Return just the data part
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods
const api = {
  // Events
  events: {
    getAll: () => apiService.get('/events'),
    getById: (id) => apiService.get(`/events/${id}`),
    create: (data) => apiService.post('/events', data),
    start: (id) => apiService.put(`/events/${id}/start`),
    stop: (id) => apiService.put(`/events/${id}/stop`),
    delete: (id) => apiService.delete(`/events/${id}`),
    getStats: () => apiService.get('/events/stats')
  },

  // Captions
  captions: {
    getByEvent: (eventId) => apiService.get(`/captions/event/${eventId}`),
    create: (data) => apiService.post('/captions', data),
    getAll: () => apiService.get('/captions'),
    delete: (id) => apiService.delete(`/captions/${id}`)
  }
};

export default api;
