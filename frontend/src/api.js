import axios from "axios";

const rawApiBase = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();
const resolvedApiBase = rawApiBase
  ? rawApiBase.replace(/\/+$/, "")
  : window.location.origin;

const API = axios.create({
  baseURL: resolvedApiBase,
});

console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);
// Automatically attach token to every request
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

// Handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const searchFoodsAPI = async (query) => {
  try {
    const response = await API.get("/api/meals/search", {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error("Food search error:", error);
    throw error;
  }
};

export default API;