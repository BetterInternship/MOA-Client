import axios from "axios";

// ! include this in the build process for vercel
// ! autogenerate on deploy on vercel
export const preconfiguredAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CLIENT_URL as string,
  withCredentials: true,
});
