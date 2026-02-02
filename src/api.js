import axios from "axios";

const API = axios.create({
  // Prefer env for prod (Vercel), fallback for local dev.
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

// 🔐 Attach token automatically to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
