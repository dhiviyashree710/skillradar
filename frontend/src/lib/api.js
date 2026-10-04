import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach the saved JWT (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("skillradar_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, the token is stale/invalid — clear it so the UI can redirect
// to /auth instead of silently failing every request after.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("skillradar_token");
      localStorage.removeItem("skillradar_user");
    }
    return Promise.reject(err);
  }
);

export default api;
