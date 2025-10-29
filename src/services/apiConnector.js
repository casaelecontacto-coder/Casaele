import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // Always expect JSON
            try {
                error.response.data = JSON.parse(error.response.request.responseText);
            } catch (e) {
                error.response.data = { success: false, message: "Invalid server response" };
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
