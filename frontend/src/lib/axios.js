import axios from "axios";

console.log("MODE:", import.meta.env.MODE);
console.log("DEV:", import.meta.env.DEV);

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});