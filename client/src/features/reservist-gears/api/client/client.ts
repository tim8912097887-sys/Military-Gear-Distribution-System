import axios from "axios";
import { normalizeApiError } from "../../../../common/error/api-error";

const prefix = "/api/v1/reservists";
export const gearClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + prefix,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptors for error handling
gearClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);
