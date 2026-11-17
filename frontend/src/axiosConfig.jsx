import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '',
  baseURL: 'http://localhost:5001', // local
  //baseURL: 'http://3.26.96.188:5001', // live
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const saved = localStorage.getItem('user');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});

export default axiosInstance;
