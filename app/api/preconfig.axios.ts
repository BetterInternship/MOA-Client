import axios from "axios";

// ! include this in the build process for vercel
// ! autogenerate on deploy on vercel
export const preconfiguredAxios = axios.create({
  baseURL: "https://api.moa.betterinternship.com",
});
