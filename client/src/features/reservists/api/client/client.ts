import axios from "axios";
import { normalizeApiError } from "../error/api-error";

const prefix = "/api/v1/reservists";
console.log("API_BASE_URL", import.meta.env.VITE_API_BASE_URL);
export const reservistClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + prefix,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptors for error handling
reservistClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);
