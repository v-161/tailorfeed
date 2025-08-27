import axios from "axios";

// Base URL comes from environment variable (Netlify sets REACT_APP_API_BASE)
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
});

export default api;
