import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4444', // your backend port
});

// Attach the JWT to every request automatically, if we have one
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;