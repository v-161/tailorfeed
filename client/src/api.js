import axios from "axios";

// This URL points directly to your deployed backend on Render.
const API_BASE = "https://tailorfeed-backend.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default api;
