import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://mini-erp-crm-5mi2.onrender.com",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("miniErpToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string" ? message : "Request failed";
  }

  return "Something went wrong";
};

export default API;
