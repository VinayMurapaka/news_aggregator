import axios from 'axios';

// Create an instance pointing to your backend URL
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000',
});

// Request interceptor to add the JWT token to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        // Add the token to the header (using 'x-auth-token' convention)
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
