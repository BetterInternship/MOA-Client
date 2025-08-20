import axios from "axios";

const preconfiguredAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CLIENT_URL as string,
  withCredentials: true,
});

export const preconfiguredAxiosFunction = async <T>(config: any): Promise<T> => {
  const response = await preconfiguredAxios.request<T>(config);
  return response.data;
};
