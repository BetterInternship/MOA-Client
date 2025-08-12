import axios from "axios";

export const preconfiguredAxios = axios.create({
  baseURL: "https://api.moa.betterinternship.com",
});
