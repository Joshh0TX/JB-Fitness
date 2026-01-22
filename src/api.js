import axios from "axios";

// Base URL for your backend
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default API;
