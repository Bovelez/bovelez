import apiClient from "./apiClient";
import type { DeleteAccountCredentials } from "../types/user.types";

export async function deleteAccount(
  credentials: DeleteAccountCredentials
): Promise<void> {
  await apiClient.delete("/users/me", {
    data: credentials,
    skipAuthRedirect: true,
  });
}
