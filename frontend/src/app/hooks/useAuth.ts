import { useUser, useLogout } from "../../hooks/auth/useAuth";

export default function useAuth() {
  const userQuery = useUser();
  const logout = useLogout();

  return {
    user: userQuery.data,
    isAuthenticated: !!userQuery.data,
    isInitializing: userQuery.isLoading,
    logout,
  };
}
