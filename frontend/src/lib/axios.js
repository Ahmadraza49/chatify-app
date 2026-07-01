import axios from "axios";

console.log("MODE:", import.meta.env.MODE);
console.log("BASE URL:", import.meta.env.DEV);

export const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});