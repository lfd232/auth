import { api } from "./axios";
import type { LoginPayload, LoginResponse, User } from "./types";

export const loginRequest = async (payload: LoginPayload) => {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
};

export const fetchProfile = async () => {
  const { data } = await api.get<{ user: User; serverTime: string }>("/api/profile");
  return data;
};
