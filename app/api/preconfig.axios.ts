import axios from "axios";

export const preconfiguredAxios = axios.create({
  baseURL: "http://localhost:5000",
});
