import apiClient from "./apiClient";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types/auth.types";

export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/login",
    credentials
  );
  return data;
}

export async function register(
  credentials: RegisterCredentials
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/register",
    credentials
  );
  return data;
}

export async function me(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}
